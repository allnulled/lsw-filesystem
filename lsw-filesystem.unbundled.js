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