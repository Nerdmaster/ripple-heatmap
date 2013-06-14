var pluginName = "heatmap"
  , util = require("util")
  , api
  , log
  , questionType
  , HM = {};

module.exports.plugin = HM;

HM.enable = function() {
  api = module.exports.pluginManager.api
  log = api.logger.logPair
  questionType = api.questionType
  api.logger.info("Enabled Heatmap");
  questionType.exists(pluginName, _createQType)
}
var _createQType = function(err, exists){
  if( err ) {
    api.logger.error(err);
    return false;
  }

  log("Exists", exists);
  if( exists ) return true;
  else 
    api.questionType.create(qTypeHM, function(err, saved){
      if( err ) api.logger.error(err);
      else log("Create Question Type", saved, util.inspect(qTypeHM) );
    });

}

var qTypeHM = {
  name:pluginName,
  title: "Heatmap",
  shortTitle: "HM",
  icon: "icon-fire",
  js: "/plugins/heatmap/js/heatmap.js"
}
HM.disable = function() {
  console.log("Disabled Heatmap");
  api.questionType.remove(pluginName, function(err, removed){
    if( err || !removed) api.logger.error(err);
    else log("Remove Question Type",pluginName);
  })
};

// Handlers
//HM.handlers = {};

// For testing, we expose direct function access
//module.exports._heatmap = {};

