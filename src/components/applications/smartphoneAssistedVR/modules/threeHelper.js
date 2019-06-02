import OBJLoader2 from "../../sharedModules/OBJLoader2";

function loadObj(path, callback) {
  const objLoader = new OBJLoader2();
  objLoader.setLogging(false, false);

  objLoader.loadMtl(path + ".mtl", null, function (materials) {
    objLoader.setMaterials(materials);
    objLoader.load(path + ".obj", function (event) {
      let model = event.detail.loaderRootNode;
      model.name = path;
      callback(model);
    });
  });
}

export {
  loadObj
};