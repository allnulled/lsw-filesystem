/*
  @artifact:     Independent artifact
  @feature:      node and browser
  @url:          https://github.com/allnulled/universal-file-system.git
  @name:         @allnulled/universal-file-system
  @version:      1.0.0
  @description:  Can manage a filesystem-like API on any: nodejs, browser (localStorage and IndexedDB)
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
    init() {
      return this;
    }
    trace(method, args = []) {
      console.log("[ufs][node-driver][" + method + "]", Array.from(args).map(arg => typeof (arg) + ": " + arg).join(", "));
    }
    resolve_path(...args) {
      this.trace("resolve_path", arguments);
      return require("path").resolve(...args);
    }
    get_current_directory() {
      this.trace("get_current_directory", arguments);
      return process.cwd();
    }
    change_directory(node) {
      this.trace("change_directory", arguments);
      return process.chdir(node);
    }
    rename(node, node2) {
      this.trace("rename", arguments);
      return require("fs").renameSync(node, node2);
    }
    read_directory(node) {
      this.trace("read_directory", arguments);
      return require("fs").readdirSync(node).reduce((out, item) => {
        const subnode_fullpath = require("path").resolve(node, item);
        out[item] = require("fs").lstatSync(subnode_fullpath).isFile() ? "..." : {};
        return out;
      }, {});
    }
    read_file(node) {
      this.trace("read_file", arguments);
      return require("fs").readFileSync(node).toString();
    }
    make_directory(node) {
      this.trace("make_directory", arguments);
      return require("fs").mkdirSync(node);
    }
    write_file(node, contents) {
      this.trace("write_file", arguments);
      return require("fs").writeFileSync(node, contents);
    }
    exists(node) {
      this.trace("exists", arguments);
      return require("fs").existsSync(node);
    }
    is_file(node) {
      this.trace("is_file", arguments);
      return require("fs").lstatSync(node).isFile();
    }
    is_directory(node) {
      this.trace("is_directory", arguments);
      return require("fs").lstatSync(node).isDirectory();
    }
    delete_file(node) {
      this.trace("delete_file", arguments);
      return require("fs").unlinkSync(node);
    }
    delete_directory(node) {
      this.trace("delete_directory", arguments);
      return require("fs").rmdirSync(node, { recursive: true });
    }
  }

  const UFS_manager_for_localstorage = class extends UFS_manager_for_node {
    constructor(storage_id = "ufs_main_storage") {
      super();
      this.storage_id = storage_id;
      this.current_directory = this.environment === "node" ? process.cwd : "/";
    }
    trace(method, args = []) {
      console.log("[ufs][ls-driver][" + method + "]", Array.from(args).map(arg => typeof (arg) + ": " + arg).join(", "));
    }
    get_persisted_data() {
      this.trace("get_persisted_data", arguments);
      if (!(this.storage_id in localStorage)) {
        localStorage[this.storage_id] = '{"files":{}}';
      }
      const data = JSON.parse(localStorage[this.storage_id]);
      return data;
    }
    set_persisted_data(data) {
      this.trace("set_persisted_data", arguments);
      localStorage[this.storage_id] = JSON.stringify(data);
    }
    remove_slash_end(txt) {
      // this.trace("remove_slash_end", arguments);
      const txt2 = txt.replace(/\/$/g, "");
      if (txt2.length === 0) {
        return "/";
      }
      return txt2;
    }
    remove_repeated_slahes(txt) {
      // this.trace("remove_repeated_slahes", arguments);
      return txt.replace(/\/(\/)+/g, "/");
    }
    resolve_path(...args) {
      this.trace("resolve_path", arguments);
      Validate_args: {
        if (args.length === 0) {
          throw new Error("Method «resolve_path» requires 1 or more parameters");
        }
        for (let index_parameter = 0; index_parameter < args.length; index_parameter++) {
          const arg = args[index_parameter];
          if (typeof arg !== "string") {
            throw new Error("Method «resolve_path» requires only strings as parameters (on index «" + index_parameter + "»)");
          }
        }
      }
      let path_parts = [];
      Format_path: {
        const replace_last_slash_for_nothing = arg => this.remove_slash_end(arg);
        path_parts = args.map(replace_last_slash_for_nothing);
        if (!path_parts[0].startsWith("/")) {
          path_parts.unshift(this.current_directory.replace(/\/$/g, ""));
        }
      }
      let path_text = "";
      Join_path: {
        const replace_fist_slash_for_nothing = arg => arg.replace(/^\//g, "");
        for (let index_part = 0; index_part < path_parts.length; index_part++) {
          const path_part = path_parts[index_part];
          if (path_part.startsWith("/")) {
            path_text = path_part;
          } else {
            if (path_text !== "/") {
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
        for (const part of parts) {
          if (part === "" || part === ".") {
            continue Iterating_parts;
          } else if (part === "..") {
            if (stack.length > 0) {
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
      this.trace("get_current_directory", arguments);
      return this.resolve_path(this.current_directory);
    }
    change_directory(node) {
      this.trace("change_directory", arguments);
      const is_directory = this.exists(node);
      if (!is_directory) {
        throw new FilesystemError("Cannot «change_directory» because destination does not exist at: «" + this.resolve_path(node) + "»");
      }
      this.current_directory = this.resolve_path(node);
      return this.current_directory;
    }
    operate_on_node(node, callback, should_persist = true) {
      this.trace("operate_on_node", arguments);
      const data = this.get_persisted_data();
      const node_solved = this.resolve_path(node);
      const node_parts = node_solved.split("/").filter(p => p !== "");
      const root = data.files;
      const current_index = ["data"];
      let pivot = root;
      let output = undefined;
      if (node_parts.length === 0) {
        output = callback(data, "files", current_index);
      } else {
        for (let index_part = 0; index_part < node_parts.length; index_part++) {
          const node_part = node_parts[index_part];
          if (index_part === (node_parts.length - 1)) {
            output = callback(pivot, node_part, current_index);
          } else {
            pivot = pivot[node_part];
          }
          current_index.push(node_part);
        }
      }
      if (should_persist) {
        this.set_persisted_data(data);
      }
      return output;
    }
    read_directory(node) {
      this.trace("read_directory", arguments);
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (!(last_property in pivot)) {
          throw new FilesystemError("Cannot «read_directory» because node does not exist at: «" + this.resolve_path(node) + "»");
        }
        if (typeof pivot[last_property] !== "object") {
          throw new FilesystemError("Cannot «read_directory» because node is a file at: «" + this.resolve_path(node) + "»");
        }
        return pivot[last_property];
      });
    }
    read_file(node) {
      this.trace("read_file", arguments);
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (!(last_property in pivot)) {
          throw new FilesystemError("Cannot «read_file» because node does not exist at: «" + this.resolve_path(node) + "»");
        }
        if (typeof pivot[last_property] !== "string") {
          throw new FilesystemError("Cannot «read_file» because node is a directory at: «" + this.resolve_path(node) + "»");
        }
        return pivot[last_property];
      });
    }
    make_directory(node) {
      this.trace("make_directory", arguments);
      this.operate_on_node(node, (pivot, last_property, index) => {
        if (last_property in pivot) {
          throw new FilesystemError("Cannot «make_directory» because node already exists at: «" + this.resolve_path(node) + "»");
        }
        pivot[last_property] = {};
      });
    }
    write_file(node, contents) {
      this.trace("write_file", arguments);
      this.operate_on_node(node, (pivot, last_property, index) => {
        if (last_property in pivot) {
          if (typeof pivot[last_property] !== "string") {
            throw new FilesystemError("Cannot «write_file» because node is a directory at: «" + this.resolve_path(node) + "»");
          }
        }
        pivot[last_property] = contents;
      });
    }
    exists(node) {
      this.trace("exists", arguments);
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (!(last_property in pivot)) {
          return false;
        }
        return true;
      }, false);
    }
    is_file(node) {
      this.trace("is_file", arguments);
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (!(last_property in pivot)) {
          return false;
        }
        if (typeof pivot[last_property] !== "string") {
          return false;
        }
        return true;
      }, false);
    }
    is_directory(node) {
      this.trace("is_directory", arguments);
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (!(last_property in pivot)) {
          return false;
        }
        if (typeof pivot[last_property] !== "object") {
          return false;
        }
        return true;
      }, false);
    }
    delete_file(node) {
      this.trace("delete_file", arguments);
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (typeof pivot[last_property] === "undefined") {
          throw new FilesystemError("Cannot «delete_file» because node does not exist at: «" + this.resolve_path(node) + "»");
        }
        if (typeof pivot[last_property] !== "string") {
          throw new FilesystemError("Cannot «delete_file» because node is a directory at: «" + this.resolve_path(node) + "»");
        }
        delete pivot[last_property];
        return true;
      }, true);
    }
    delete_directory(node) {
      this.trace("delete_directory", arguments);
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (typeof pivot[last_property] === "undefined") {
          console.log(pivot);
          console.log(last_property);
          throw new FilesystemError("Cannot «delete_directory» because does not exists at: «" + this.resolve_path(node) + "»");
        }
        if (typeof pivot[last_property] !== "object") {
          throw new FilesystemError("Cannot «delete_directory» because node is a file at: «" + this.resolve_path(node) + "»");
        }
        delete pivot[last_property];
        return true;
      }, true);
    }
    rename(node, node2) {
      this.trace("rename", arguments);
      const last_name = this.resolve_path(node2).split("/").filter(p => p !== "").pop();
      return this.operate_on_node(node, (pivot, last_property, index) => {
        if (typeof pivot[last_property] === "undefined") {
          throw new FilesystemError("Cannot «rename» because does not exists at: «" + this.resolve_path(node) + "»");
        }
        pivot[last_name] = pivot[last_property];
        pivot[last_property] = undefined;
        delete pivot[last_property];
        return true;
      }, true);
    }

  }

  const UFS_manager_for_idb = class extends UFS_manager_for_localstorage {

    constructor(db_name = "ufs_db") {
      super();
      this.db_name = db_name;
      this.db = null;
      this.current_directory = "/";
    }

    trace(method, args = []) {
      console.log("[ufs][idb-driver][" + method + "]", Array.from(args).map(arg => typeof (arg) + ": " + arg).join(", "));
    }

    init() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.db_name, 1);
        request.onupgradeneeded = (event) => {
          let db = event.target.result;
          if (!db.objectStoreNames.contains("ufs")) {
            let store = db.createObjectStore("ufs", {
              keyPath: "id",
              autoIncrement: true,
            });
            store.createIndex("filepath", "filepath", { unique: true });
          }
        };
        request.onsuccess = (event) => {
          this.db = event.target.result;
          resolve();
        };
        request.onerror = (event) => reject(event.target.error);
      });
    }

    _get_filename(somepath) {
      return somepath.split("/").filter(p => typeof (p) !== "undefined").pop();
    }

    isImmediateSubpathFrom(subpath, matchable) {
      const matchablePos = matchable.length;
      const coincidesParentPath = subpath.substr(0, matchablePos) === matchable;
      if (!coincidesParentPath) return false;
      const hasNoMoreSlashes = subpath.substr(matchablePos).indexOf("/") === -1;
      if (!hasNoMoreSlashes) return false;
      return true;
    }

    read_directory(parentIdInput = "/") {
      this.trace("read_directory", arguments);
      const parentId = this.resolve_path(parentIdInput);
      return new Promise((resolve, reject) => {
        The_previous_process: {
          break The_previous_process;
          const transaction = this.db.transaction("ufs", "readonly");
          const store = transaction.objectStore("ufs");
          const index = store.index("filepath");
          const request = index.getAll(parentId);
          request.onsuccess = () => {
            let result = {};
            for (let item of request.result) {
              result[item.name] = item.type === "file" ? "..." : {};
            }
            resolve(result);
          };
        }
        const transaction = this.db.transaction("ufs", 'readonly');
        const objectStore = transaction.objectStore("ufs");
        const request = objectStore.openCursor(); // Usa cursor para recorrer la BD sin cargar todo en memoria
        const results = [];
        const matchableSubpath = (parentId === "/") ? parentId : (parentId + "/");
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            let isAccepted = false;
            try {
              isAccepted = cursor.value.filepath.startsWith(matchableSubpath);
              isAccepted = isAccepted && this.isImmediateSubpathFrom(cursor.value.filepath, matchableSubpath);
            } catch (error) {
              console.error("Error arised from filter callback on «browsie.selectMany»", error);
            }
            if (isAccepted) {
              // Añade a la colección de salida
              results.push(cursor.value);
            }
            cursor.continue(); // Avanza al siguiente registro
          } else {
            // Se formatean los resultados:
            const formattedResults = {};
            results.forEach(row => {
              const rowName = this._get_filename(row.filepath);
              formattedResults[rowName] = row.type === "file" ? "..." : {};
            });
            resolve(formattedResults);
          }
        };
        request.onerror = () => reject(request.error);
      });
    }

    read_file(nodeInput) {
      this.trace("read_file", arguments);
      const node = this.resolve_path(nodeInput);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", "readonly");
        const store = transaction.objectStore("ufs");
        const indexStore = store.index("filepath");
        const request = indexStore.get(node);
        request.onsuccess = () => {
          resolve(request.result ? request.result.content : null);
        };
        request.onerror = () => reject(request.error);
      });
    }

    async write_file(nodeInput, contents) {
      this.trace("write_file", arguments);
      const node = this.resolve_path(nodeInput);
      const file = await this.$filepath(node);
      return await new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", "readwrite");
        const store = transaction.objectStore("ufs");
        const filedata = { filepath: node, type: "file", content: contents };
        if (file) {
          filedata.id = file.id;
        }
        store.put(filedata);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }

    async make_directory(nodeInput) {
      this.trace("make_directory", arguments);
      const node = this.resolve_path(nodeInput);
      return await new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", "readwrite");
        const store = transaction.objectStore("ufs");
        store.put({ filepath: node, type: "directory" });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }

    exists(nodeInput) {
      this.trace("exists", arguments);
      const node = this.resolve_path(nodeInput);
      return new Promise((resolve) => {
        const transaction = this.db.transaction("ufs", "readonly");
        const store = transaction.objectStore("ufs");
        const indexStore = store.index("filepath");
        const request = indexStore.get(node);
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => resolve(false);
      });
    }

    is_file(nodeInput) {
      this.trace("is_file", arguments);
      const node = this.resolve_path(nodeInput);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", "readonly");
        const store = transaction.objectStore("ufs");
        const indexStore = store.index("filepath");
        const request = indexStore.get(node);
        request.onsuccess = () => resolve(request.result ? request.result.type === "file" : false);
        request.onerror = () => reject(request.error);
      });
    }

    is_directory(nodeInput) {
      this.trace("is_directory", arguments);
      const node = this.resolve_path(nodeInput);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", "readonly");
        const store = transaction.objectStore("ufs");
        const indexStore = store.index("filepath");
        const request = indexStore.get(node);
        request.onsuccess = () => resolve(request.result ? request.result.type === "directory" : false);
        request.onerror = () => reject(request.error);
      });
    }

    delete_file(nodeInput) {
      this.trace("delete_file", arguments);
      const node = this.resolve_path(nodeInput);
      return this.$deleteMany(file => {
        return (file.type === "file") && (file.filepath === node);
      });
    }

    async delete_directory(nodeInput) {
      this.trace("delete_directory", arguments);
      const node = this.resolve_path(nodeInput);
      await this.$deleteMany(file => file.filepath.startsWith(node));
      await this.$deleteMany(file => file.filepath === node);
    }

    $updateMany(filterCallback, expanderCallback) {
      this.trace("$updateMany", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", 'readwrite');
        const objectStore = transaction.objectStore("ufs");
        const request = objectStore.openCursor();
        let updatedCount = 0;
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const isAccepted = filterCallback(cursor.value, cursor);
            if (isAccepted) {
              const expanderItem = expanderCallback({ ...cursor.value }, cursor);
              const updatedItem = { ...cursor.value, ...expanderItem };
              const updateRequest = cursor.update(updatedItem);
              updateRequest.onsuccess = () => {
                updatedCount++;
              };
            }
            cursor.continue();
          } else {
            return resolve(updatedCount);
          }
        };
        request.onerror = () => reject(transaction.error);
      });
    }

    $deleteMany(filterCallback) {
      this.trace("$deleteMany", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", 'readwrite');
        const objectStore = transaction.objectStore("ufs");
        const request = objectStore.openCursor();
        let deletedCount = 0;
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const isAccepted = filterCallback(cursor.value, cursor);
            if (isAccepted) {
              const deleteRequest = cursor.delete();
              deleteRequest.onsuccess = () => {
                deletedCount++;
              };
            }
            cursor.continue();
          } else {
            return resolve(deletedCount);
          }
        };
        request.onerror = () => reject(transaction.error);
      });
    }

    rename(nodeInput, newName) {
      this.trace("rename", arguments);
      const node = this.resolve_path(nodeInput);
      const newNode = node.split("/").slice(0, -1).concat(newName).join("/") || "/";
      const pathBegin = node.replace(/\/$/g, "") + "/";
      const newNodeBegin = newNode.replace(/\/$/g, "") + "/";
      console.log("Buscando nodos que empiecen por: «" + pathBegin + "»");
      const renameSubnodes = async () => {
        const allSubnodes = await this.$selectMany(file => file.filepath.startsWith(pathBegin));
        const allPromises = [];
        for (let index = 0; index < allSubnodes.length; index++) {
          const subnode = allSubnodes[index];
          const newSubpath = subnode.filepath.replace(pathBegin, newNodeBegin);;
          console.log("Reemplazando a:", subnode.filepath, "Por:", newSubpath);
          const subpromise = this.$update(subnode.id, { filepath: newSubpath });
          allPromises.push(subpromise);
        }
        return await Promise.all(allPromises);
      };
      const renameNode = () => new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", "readwrite");
        const store = transaction.objectStore("ufs");
        const indexStore = store.index("filepath");
        const request = indexStore.get(node);
        request.onsuccess = () => {
          if (!request.result) {
            reject(new Error("Node not found"));
            return;
          }
          const data = request.result;
          data.filepath = newNode;
          store.put(data);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
      return Promise.all([
        renameNode().then(() => renameSubnodes()),
      ]);
    }

    async $filepath(filepath) {
      const selection = await this.$selectMany(file => file.filepath === filepath);
      if (selection.length === 1) {
        return selection[0];
      } else if (selection.length > 1) {
        return selection;
      }
      return null;
    }

    $selectMany(filterCallback) {
      this.trace("$selectMany", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", 'readonly');
        const objectStore = transaction.objectStore("ufs");
        const request = objectStore.openCursor(); // Usa cursor para recorrer la BD sin cargar todo en memoria
        const results = [];
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            let isAccepted = undefined;
            try {
              isAccepted = filterCallback(cursor.value);
            } catch (error) {
              console.error("Error arised from filter callback on «selectMany»", error);
            }
            if (isAccepted) { // Aplica la función de filtro
              results.push(cursor.value);
            }
            cursor.continue(); // Avanza al siguiente registro
          } else {
            resolve(results); // Se terminó el recorrido
          }
        };
        request.onerror = () => reject(request.error);
      });
    }

    $update(id, item) {
      this.trace("$update", arguments);
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction("ufs", 'readwrite');
        const objectStore = transaction.objectStore("ufs");
        const request0 = objectStore.get(id);
        request0.onsuccess = () => {
          const originalState = request0.result;
          if (!originalState) return reject(`No item found by id «${id}» on «$update»`);
          const request = objectStore.put({ ...originalState, ...item, id });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        };
        request0.onerror = () => reject(request0.error);
      });
    }

  }

  const api = {
    node_driver: UFS_manager_for_node,
    localstorage_driver: UFS_manager_for_localstorage,
    idb_driver: UFS_manager_for_idb,
    create(...args) {
      const clazz = typeof global !== "undefined" ? UFS_manager_for_node : UFS_manager_for_localstorage;
      return new clazz(...args);
    },
    driver(id) {
      const driverId = id.toLowerCase() + "_driver";
      if (!(driverId in api)) {
        throw new Error(`Cannot find driver «${driverId}» on «UFS_manager.driver»`);
      }
      return {
        create(...args) {
          const clazz = api[driverId];
          return new clazz(...args);
        }
      }
    }
  };

  return api;
});