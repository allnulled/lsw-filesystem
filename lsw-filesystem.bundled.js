/*
  @artifact:  Lite Starter Web Dependency
  @url:       https://github.com/allnulled/lsw-filesystem.git
  @name:      @allnulled/lsw-filesystem
  @version:   1.0.0
*/
(function (factory) {
  const name = "UFS_manager";
  const modulo = factory();
  if (typeof window !== 'undefined') {
    window[name] = modulo;
  }
  if (typeof module !== 'undefined') {
    module.exports = modulo;
  }
  if (typeof global !== 'undefined') {
    global[name] = modulo;
  }
  return modulo;
})(function () {
  const FilesystemError = class extends Error {
      constructor(...args) {
          super(...args);
          this.name = "FilesystemError";
      }
  }
  const UFS_manager_for_node = class {
    constructor() {
      // @OK
    }
    trace(method) {
      console.log("[ufs][" + method + "]");
    }
    resolve_path(...args) {
      this.trace("resolve_path");
      return require("path").resolve(...args);
    }
    get_current_directory() {
      this.trace("get_current_directory");
      return process.cwd();
    }
    change_directory(node) {
      this.trace("change_directory");
      return process.chdir(node);
    }
    rename(node, node2) {
      this.trace("rename");
      return require("fs").renameSync(node, node2);
    }
    read_directory(node) {
      this.trace("read_directory");
      return require("fs").readdirSync(node).reduce((out, item) => {
        const subnode_fullpath = require("path").resolve(node, item);
        out[item] = require("fs").lstatSync(subnode_fullpath).isFile() ? "..." : {};
        return out;
      }, {});
    }
    read_file(node) {
      this.trace("read_file");
      return require("fs").readFileSync(node).toString();
    }
    make_directory(node) {
      this.trace("make_directory");
      return require("fs").mkdirSync(node);
    }
    write_file(node, contents) {
      this.trace("write_file");
      return require("fs").writeFileSync(node, contents);
    }
    exists(node) {
      this.trace("exists");
      return require("fs").existsSync(node);
    }
    is_file(node) {
      this.trace("is_file");
      return require("fs").lstatSync(node).isFile();
    }
    is_directory(node) {
      this.trace("is_directory");
      return require("fs").lstatSync(node).isDirectory();
    }
    delete_file(node) {
      this.trace("delete_file");
      return require("fs").unlinkSync(node);
    }
    delete_directory(node) {
      this.trace("delete_directory");
      return require("fs").rmdirSync(node, { recursive: true });
    }
  }
  const UFS_manager_for_browser = class extends UFS_manager_for_node {
    constructor(storage_id = "ufs_main_storage") {
      super();
      this.storage_id = storage_id;
      this.current_directory = this.environment === "node" ? process.cwd : "/";
    }
    get_persisted_data() {
      this.trace("get_persisted_data");
      if(!(this.storage_id in localStorage)) {
        localStorage[this.storage_id] = '{"files":{}}';
      }
      const data = JSON.parse(localStorage[this.storage_id]);
      return data;
    }
    set_persisted_data(data) {
      this.trace("set_persisted_data");
      localStorage[this.storage_id] = JSON.stringify(data);
    }
    remove_slash_end(txt) {
      // this.trace("remove_slash_end");
      const txt2 = txt.replace(/\/$/g, "");
      if(txt2.length === 0) {
        return "/";
      }
      return txt2;
    }
    remove_repeated_slahes(txt) {
      // this.trace("remove_repeated_slahes");
      return txt.replace(/\/(\/)+/g, "/");
    }
    resolve_path(...args) {
      this.trace("resolve_path");
      Validate_args: {
        if(args.length === 0) {
          throw new Error("Method «resolve_path» requires 1 or more parameters");
        }
        for(let index_parameter=0; index_parameter<args.length; index_parameter++) {
          const arg = args[index_parameter];
          if(typeof arg !== "string") {
            throw new Error("Method «resolve_path» requires only strings as parameters (on index «" + index_parameter + "»)");
          }
        }
      }
      let path_parts = [];
      Format_path: {
        const replace_last_slash_for_nothing = arg => this.remove_slash_end(arg);
        path_parts = args.map(replace_last_slash_for_nothing);
        if(!path_parts[0].startsWith("/")) {
          path_parts.unshift(this.current_directory.replace(/\/$/g, ""));
        }
      }
      let path_text = "";
      Join_path: {
        const replace_fist_slash_for_nothing = arg => arg.replace(/^\//g, "");
        for(let index_part=0; index_part<path_parts.length; index_part++) {
          const path_part = path_parts[index_part];
          if(path_part.startsWith("/")) {
            path_text = path_part;
          } else {
            if(path_text !== "/") {
              path_text += "/";
            }
            path_text += path_part.replace(replace_fist_slash_for_nothing);
          }
        }
      }
      Fix_slash_repetitions: {
        path_text = this.remove_repeated_slahes(path_text);
      }
      Resolve_double_dots: {
        const parts = path_text.split("/");
        const stack = [];
        Iterating_parts:
        for(const part of parts) {
          if(part === "" || part === ".") {
            continue Iterating_parts;
          } else if(part === "..") {
            if(stack.length > 0) {
              stack.pop();
            }
          } else {
            stack.push(part);
          }
        }
        path_text = "/" + stack.join("/");
      }
      return path_text;
    }
    get_current_directory() {
      this.trace("get_current_directory");
      return this.resolve_path(this.current_directory);
    }
    change_directory(node) {
      this.trace("change_directory");
      const is_directory = this.exists(node);
      if(!is_directory) {
        throw new FilesystemError("Cannot «change_directory» because destination does not exist at: «" + this.resolve_path(node) + "»");
      }
      this.current_directory = this.resolve_path(node);
      return this.current_directory;
    }
    operate_on_node(node, callback, should_persist = true) {
      this.trace("operate_on_node");
      const data = this.get_persisted_data();
      const node_solved = this.resolve_path(node);
      const node_parts = node_solved.split("/").filter(p => p !== "");
      const root = data.files;
      const current_index = ["data"];
      let pivot = root;
      let output = undefined;
      if(node_parts.length === 0) {
        output = callback(data, "files", current_index);
      } else {
        for(let index_part=0; index_part<node_parts.length; index_part++) {
          const node_part = node_parts[index_part];
          if(index_part === (node_parts.length-1)) {
            output = callback(pivot, node_part, current_index);
          } else {
            pivot = pivot[node_part];
          }
          current_index.push(node_part);
        }
      }
      if(should_persist) {
        this.set_persisted_data(data);
      }
      return output;
    }
    read_directory(node) {
      this.trace("read_directory");
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(!(last_property in pivot)) {
          throw new FilesystemError("Cannot «read_directory» because node does not exist at: «" + this.resolve_path(node) + "»");
        }
        if(typeof pivot[last_property] !== "object") {
          throw new FilesystemError("Cannot «read_directory» because node is a file at: «" + this.resolve_path(node) + "»");
        }
        return pivot[last_property];
      });
    }
    read_file(node) {
      this.trace("read_file");
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(!(last_property in pivot)) {
          throw new FilesystemError("Cannot «read_file» because node does not exist at: «" + this.resolve_path(node) + "»");
        }
        if(typeof pivot[last_property] !== "string") {
          throw new FilesystemError("Cannot «read_file» because node is a directory at: «" + this.resolve_path(node) + "»");
        }
        return pivot[last_property];
      });
    }
    make_directory(node) {
      this.trace("make_directory");
      this.operate_on_node(node, (pivot, last_property, index) => {
        if(last_property in pivot) {
          throw new FilesystemError("Cannot «make_directory» because node already exists at: «" + this.resolve_path(node) + "»");
        }
        pivot[last_property] = {};
      });
    }
    write_file(node, contents) {
      this.trace("write_file");
      this.operate_on_node(node, (pivot, last_property, index) => {
        if(last_property in pivot) {
          if(typeof pivot[last_property] !== "string") {
            throw new FilesystemError("Cannot «write_file» because node is a directory at: «" + this.resolve_path(node) + "»");
          }
        }
        pivot[last_property] = contents;
      });
    }
    exists(node) {
      this.trace("exists");
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(!(last_property in pivot)) {
          return false;
        }
        return true;
      }, false);
    }
    is_file(node) {
      this.trace("is_file");
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(!(last_property in pivot)) {
          return false;
        }
        if(typeof pivot[last_property] !== "string") {
          return false;
        }
        return true;
      }, false);
    }
    is_directory(node) {
      this.trace("is_directory");
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(!(last_property in pivot)) {
          return false;
        }
        if(typeof pivot[last_property] !== "object") {
          return false;
        }
        return true;
      }, false);
    }
    delete_file(node) {
      this.trace("delete_file");
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(typeof pivot[last_property] === "undefined") {
          throw new FilesystemError("Cannot «delete_file» because node does not exist at: «" + this.resolve_path(node) + "»");
        }
        if(typeof pivot[last_property] !== "string") {
          throw new FilesystemError("Cannot «delete_file» because node is a directory at: «" + this.resolve_path(node) + "»");
        }
        delete pivot[last_property];
        return true;
      }, true);
    }
    delete_directory(node) {
      this.trace("delete_directory");
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(typeof pivot[last_property] === "undefined") {
          console.log(pivot);
          console.log(last_property);
          throw new FilesystemError("Cannot «delete_directory» because does not exists at: «" + this.resolve_path(node) + "»");
        }
        if(typeof pivot[last_property] !== "object") {
          throw new FilesystemError("Cannot «delete_directory» because node is a file at: «" + this.resolve_path(node) + "»");
        }
        delete pivot[last_property];
        return true;
      }, true);
    }
    rename(node, node2) {
      this.trace("rename");
      const last_name = this.resolve_path(node2).split("/").filter(p => p !== "").pop();
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if(typeof pivot[last_property] === "undefined") {
          throw new FilesystemError("Cannot «rename» because does not exists at: «" + this.resolve_path(node) + "»");
        }
        pivot[last_name] = pivot[last_property];
        pivot[last_property] = undefined;
        delete pivot[last_property];
        return true;
      }, true);
    }
  }
  
  class UFS_manager_for_idb extends UFS_manager_for_browser {
    constructor(storage_id = "ufs_main_storage") {
      super(storage_id);
      this.db = null;
      this.initialize_database();
    }
    
    async initialize_database() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.storage_id, 1);
        request.onupgradeneeded = event => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("files")) {
            db.createObjectStore("files", { keyPath: "path" });
          }
        };
        request.onsuccess = event => {
          this.db = event.target.result;
          resolve(this.db);
        };
        request.onerror = event => reject(event.target.error);
      });
    }
    
    async get_persisted_data() {
      this.trace("get_persisted_data");
      if (!this.db) await this.initialize_database();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("files", "readonly");
        const store = transaction.objectStore("files");
        const request = store.getAll();
        request.onsuccess = () => {
          const result = request.result.reduce((acc, file) => {
            acc[file.path] = file.contents;
            return acc;
          }, {});
          resolve({ files: result });
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    async set_persisted_data(data) {
      this.trace("set_persisted_data");
      if (!this.db) await this.initialize_database();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("files", "readwrite");
        const store = transaction.objectStore("files");
        Object.entries(data.files).forEach(([path, contents]) => {
          store.put({ path, contents });
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  }
  
  return {
    node_driver: UFS_manager_for_node,
    browser_driver: UFS_manager_for_browser,
    idb_driver: UFS_manager_for_idb,
    create(...args) {
      const clazz = typeof indexedDB !== "undefined" ? UFS_manager_for_idb : (typeof global !== "undefined" ? UFS_manager_for_node : UFS_manager_for_browser);
      return new clazz(...args);
    }
  };
});
(function (factory) {
  const mod = factory();
  if (typeof window !== 'undefined') {
    window["Browsie"] = mod;
  }
  if (typeof global !== 'undefined') {
    // global["Browsie"] = mod;
  }
  if (typeof module !== 'undefined') {
    // module.exports = mod;
  }
})(function () {

  class BrowsieStaticAPI {

    static openedConnections = [];

    static _trace = true;

    static trace(methodName, args = []) {
      if (this._trace) {
        console.log("[TRACE][" + methodName + "]", args.length + " args: " + Array.from(args).map(arg => typeof (arg)).join(", "));
      }
    }

    static async listDatabases() {
      this.trace("Browsie.listDatabases", arguments);
      try {
        const databases = await indexedDB.databases();
        console.log('Bases de datos disponibles:', databases);
        return databases;
      } catch (error) {
        console.error('Error al obtener las bases de datos:', error);
      }
    }

    static createDatabase(dbName, schemaDefinition = null, version = 1, versionUpgrades = {}) {
      this.trace("Browsie.createDatabase", arguments);
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        request.onsuccess = () => {
          console.log(`[SUCCESS] Database "${dbName}" created/opened successfully.`);
          request.result.close();
          resolve(request.result);
        };
        request.onerror = (error) => {
          console.error(`[ERROR] Failed to create/open database "${dbName}":`, error);
          reject(error);
        };
        request.onupgradeneeded = async (event) => {
          const db = event.target.result;
          console.log(`[UPGRADE] Upgrading database "${dbName}" from version ${event.oldVersion} to ${version}.`);
          // Si hay una definición de esquema inicial, crear los almacenes e índices
          if (schemaDefinition && event.oldVersion === 0) {
            console.log("[SCHEMA] Applying initial schema definition.");
            Object.keys(schemaDefinition).forEach((storeName) => {
              if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, {
                  keyPath: "id",
                  autoIncrement: true,
                });
                schemaDefinition[storeName].forEach((index) => {
                  const indexName = index.replace(/^\!/, "");
                  objectStore.createIndex(indexName, indexName, { unique: index.startsWith("!") });
                });
              }
            });
          }
          // Aplicar las transformaciones de esquema para cada versión
          for (let v = event.oldVersion + 1; v <= version; v++) {
            if (versionUpgrades[v]) {
              console.log(`[VERSION ${v}] Applying upgrade function.`);
              await versionUpgrades[v](db);
            } else {
              console.log(`[VERSION ${v}] No upgrade function defined.`);
            }
          }
        };
      });
    }

    // Obtener todos los datos de un store
    static async getAllDataFromStore(dbName, storeName) {
      this.trace("Browsie.getAllDataFromStore", arguments);
      return await new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);

          const getAllRequest = store.getAll();
          getAllRequest.onsuccess = () => resolve(getAllRequest.result);
          getAllRequest.onerror = () => {
            db.close();
            reject(new Error('Error al obtener los datos del store'));
          };
        };

        request.onerror = () => {
          reject(new Error('Error al abrir la base de datos'));
        };
      });
    }

    // Insertar datos en un store
    static async insertDataIntoStore(dbName, storeName, data) {
      this.trace("Browsie.insertDataIntoStore", arguments);
      return await new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);

        request.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);

          data.forEach(item => store.add(item));

          transaction.oncomplete = () => resolve();
          transaction.onerror = () => {
            db.close();
            reject(new Error('Error al insertar los datos en el store'));
          };
        };

        request.onerror = () => {
          reject(new Error('Error al abrir la base de datos'));
        };
      });
    }

    // Eliminar una base de datos
    static deleteDatabase(dbName) {
      this.trace("Browsie.deleteDatabase", arguments);
      return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);

        request.onblocked = () => {
          db.close();
          reject(new Error("Error al eliminar la base de datos porque está bloqueada"));
        };
        request.onsuccess = () => resolve();
        request.onerror = () => {
          db.close();
          reject(new Error('Error al eliminar la base de datos'));
        };
      });
    }

    static async getSchema(dbName) {
      this.trace("Browsie.getSchema", arguments);
      let db = undefined;
      try {
        // Abrir la base de datos en modo solo lectura
        const request = indexedDB.open(dbName);

        db = await new Promise((resolve, reject) => {
          request.onsuccess = (event) => resolve(event.target.result);
          request.onerror = () => {
            reject(new Error('Error al abrir la base de datos'));
          };
        });

        // Construir el esquema a partir de los almacenes
        const schema = {};
        const objectStoreNames = Array.from(db.objectStoreNames); // Lista de stores

        objectStoreNames.forEach(storeName => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);

          const storeInfo = {
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement,
            indexes: []
          };

          // Recorrer los índices del store
          const indexNames = Array.from(store.indexNames); // Lista de índices
          indexNames.forEach(indexName => {
            const index = store.index(indexName);
            storeInfo.indexes.push({
              name: index.name,
              keyPath: index.keyPath,
              unique: index.unique,
              multiEntry: index.multiEntry
            });
          });

          schema[storeName] = storeInfo;
        });

        return schema;
      } catch (error) {
        console.error('Error al obtener el esquema:', error);
        throw error;
      } finally {
        if (db) {
          db.close();
        }
      }
    }

  }

  class BrowsieTriggersAPI extends BrowsieStaticAPI {

    static globMatch = TriggersClass.globMatch;

    triggers = new TriggersClass()

  }


  class BrowsieCrudAPI extends BrowsieTriggersAPI {

    static async open(...args) {
      this.trace("Browsie.open", arguments);
      const db = new this(...args);
      await db.open();
      return db;
    }

    // Constructor que abre la base de datos
    constructor(dbName, trace = false) {
      super();
      this.dbName = dbName;
      this.db = null;
      this._trace = trace;
    }

    // Abre la base de datos
    open() {
      this.constructor.trace("browsie.open", arguments);
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName);

        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.open» operation over database «${this.dbName}»: `));
      });
    }

    close(...args) {
      this.constructor.trace("browsie.close", arguments);
      return this.db.close(...args);
    }

    // Método para seleccionar elementos de un store con un filtro
    select(store, filter) {
      this.constructor.trace("browsie.select", arguments);
      this.triggers.emit(`crud.select.one.${store}`, { store, filter });
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readonly');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.getAll();

        request.onsuccess = () => {
          const result = request.result.filter(item => {
            return Object.keys(filter).every(key => item[key] === filter[key]);
          });
          resolve(result);
        };
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.select» operation over store «${store}»: `));
      });
    }

    // Método para insertar un solo item en un store
    insert(store, item) {
      this.constructor.trace("browsie.insert", arguments);
      this.triggers.emit(`crud.insert.one.${store}`, { store, item });
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.add(item);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.insert» operation over store «${store}»: `));
      });
    }

    // Método para actualizar un item en un store
    update(store, id, item) {
      this.constructor.trace("browsie.update", arguments);
      this.triggers.emit(`crud.update.one.${store}`, { store, id, item });
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.put({ ...item, id });

        request.onsuccess = () => resolve(request.result);
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.update» operation over store «${store}»: `));
      });
    }

    // Método para eliminar un item de un store por ID
    delete(store, id) {
      this.constructor.trace("browsie.delete", arguments);
      this.triggers.emit(`crud.delete.one.${store}`, { store, id });
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.delete» operation over store «${store}»: `));
      });
    }

    _expandError(errorObject, baseMessage = false) {
      this.constructor.trace("browsie._expandError", arguments);
      let error = errorObject;
      if (errorObject instanceof Error) {
        error = errorObject;
      } else if (errorObject.target && errorObject.target.error) {
        error = errorObject.target.error;
      } else {
        error = new Error(errorObject);
      }
      if (baseMessage) {
        const errorTemp = new Error(error.message ?? error);
        Object.assign(errorTemp, error);
        errorTemp.message = baseMessage + errorTemp.message;
        error = errorTemp;
      }
      return error;
    }

    // Método para insertar varios items en un store
    insertMany(store, items) {
      this.constructor.trace("browsie.insertMany", arguments);
      this.triggers.emit(`crud.insert.many.${store}`, { store, items });
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        let insertedCount = 0;

        items.forEach(item => {
          const request = objectStore.add(item);
          request.onsuccess = () => {
            insertedCount++;
            if (insertedCount === items.length) resolve();
          };
          request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.insertMany» operation over store «${store}» inserting «${items.length}» items: `));
        });
      });
    }

    // Método para actualizar varios items en un store
    updateMany(store, filter, item) {
      this.constructor.trace("browsie.updateMany", arguments);
      this.triggers.emit(`crud.update.many.${store}`, { store, filter, item });
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.openCursor();
        let updatedCount = 0;
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            if (Object.keys(filter).every(key => cursor.value[key] === filter[key])) {
              const updatedItem = { ...cursor.value, ...item };
              const updateRequest = cursor.update(updatedItem);
              updateRequest.onsuccess = () => {
                updatedCount++;
                if (updatedCount === cursor.value.length) resolve();
              };
            }
            cursor.continue();
          }
        };

        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.updateMany» operation over store «${store}»: `));
      });
    }

    // Método para eliminar varios items de un store según un filtro
    deleteMany(store, filter) {
      this.constructor.trace("browsie.deleteMany", arguments);
      this.triggers.emit(`crud.delete.many.${store}`, { store, filter });
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.openCursor();

        let deletedCount = 0;
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            if (Object.keys(filter).every(key => cursor.value[key] === filter[key])) {
              const deleteRequest = cursor.delete();
              deleteRequest.onsuccess = () => {
                deletedCount++;
                if (deletedCount === cursor.value.length) resolve();
              };
            }
            cursor.continue();
          }
        };

        request.onerror = (error) => reject(this._expandError(error, `Error on «browsie.deleteMany» operation over store «${store}»: `));
      });
    }
  }

  class Browsie extends BrowsieCrudAPI {

  }

  Browsie.default = Browsie;

  return Browsie;

});
(function (factory) {
  const mod = factory();
  if (typeof window !== 'undefined') {
    window['LswFilesystem'] = mod;
  }
  if (typeof global !== 'undefined') {
    global['LswFilesystem'] = mod;
  }
  if (typeof module !== 'undefined') {
    module.exports = mod;
  }
})(function () {
  
  class LswFilesystem {

  }

  return LswFilesystem;

});
