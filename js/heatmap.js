RIPPLE.questionType['heatmap'] = {
  params: {
    ansObj:[],
    heatURLID:"heatmap-url",
    mapID: "heatmap-img",
    mapWrap: "heatmap-answer",
    mapConfig: {
      element: "heatmap-answer",
      radius: 20,
      opacity: 50
    },
    mapObj:{},
    mapSize:{
      width:0,
      height:0
    },
    imgObj:{},
    imgSrc:null,
    imgLoaded: false,
    imgSize:{
      width:0,
      height:0,
    },
    scriptLoaded: false,
    questionObj:{}
  },

  createMap: function(callback){
    var heatmap = RIPPLE.questionType['heatmap']
      , params = heatmap.params
      , loader = $("<div/>").addClass("loader")
      , jMapWrap = $("#" + params.mapWrap)
      , hasMap = params.mapObj.length > 0
      , imgSrc = params.imgSrc;

    // Load image
    var img = $("<img/>").attr({src: imgSrc, id: params.mapID});

    // Define image object as heatmap param
    heatmap.params.imgObj = img;

    // Display Embedded Graphic  
    jMapWrap.empty();
    jMapWrap.append(loader);
    jMapWrap.append(img);
    img.hide();

    // Load Image in Memory 
    if( !hasMap ) heatmap.determineImageSize();

    //Dimension Map Wrap
    heatmap.dimensionMapWrap(callback);
  },

  initMap: function(options){
    console.log("initMap args :: ", arguments);
    var heatmap = RIPPLE.questionType['heatmap']
      , params = heatmap.params;

    options = options || {};

    // Remove Map
    var hasMap = params.mapObj.length > 0;
    if( hasMap ){
      console.log("Canvas :: ",params.mapObj.get("canvas"));
      document.getElementById(params.mapWrap).removeChild( params.mapObj.get("canvas") );
      params.mapObj = {};      
    } 

    // Create Map
    heatmap.createMap(function(){
      // After map is created then create heatmap
      createFactory();
    });

    function createFactory(){
      var ansObj = heatmap.params.ansObj || false; 
      // Initialize JS heatmap
      heatmap.params.mapObj = heatmapFactory.create(heatmap.params.mapConfig);

      // Reload Data
      var hasData = ansObj.length > 0;
      if( hasData ) {
        for (var i = ansObj.length - 1; i >= 0; i--) {
          var currPoint = ansObj[i]
            , x = heatmap.params.mapSize.width * currPoint[0]
            , y = heatmap.params.mapSize.height * currPoint[1];
        
          console.log("Reload Point :: ", currPoint);
          heatmap.params.mapObj.store.addDataPoint(x,y);
        };
      }

      // Fire Completed Options Function
      var hasCompletedFn = options.hasOwnProperty('completed') && typeof options.completed === 'function';
      if( hasCompletedFn ) options.completed();
    };

  },

  determineImageSize: function(){
    var heatmap = RIPPLE.questionType['heatmap'];
    
    // Check to see if image is already loaded
    if( heatmap.params.imgSrc.loaded ) return;

    // Make in memory copy of image to avoid css issues
    var img = $('<img/>')
      .attr("src", heatmap.params.imgSrc)
      .load(function(){
        heatmap.params.imgLoaded = true;
        heatmap.params.imgSize.width = this.width;
        heatmap.params.imgSize.height = this.height;
        img.remove();
      });
  },

  dimensionMapWrap: function(callback){
    var heatmap = RIPPLE.questionType['heatmap']
      , img = $("#"+heatmap.params.mapID)
      , jMapWrap = $('#'+heatmap.params.mapWrap)
      , w;

    // Set Params
    // NOTE: firing early so need to pool for response
    //heatmap.mapSize.set([imgActualWidth, imgActualHeight])
    console.log("Image Size :: ", heatmap.params.imgSize.width );
    
    // Check for img size
    if( !imgDefined() ) {
      // Poll for change
      var timer = setInterval( function(){
        if( imgDefined() ) clearInterval(timer);
        setSize(callback);
      }, 100);
    } else setSize(callback);
    
    function imgDefined(){
      var imgSizeWidth = heatmap.params.imgSize.width;
      return imgSizeWidth !== 0 && img.width() !== 0;
    };

    function setSize(callback){
      var heatmap = RIPPLE.questionType['heatmap'];

      // Clear current Size of wrapper
      jMapWrap.css({'width':'auto'});

      // Determine Sizes
      var parentWidth = jMapWrap.width()
        , parentHeight = jMapWrap.height()      
        , imgSizeWidth = heatmap.params.imgSize.width
        , imgActualWidth = ( imgSizeWidth !== 0 ) ? imgSizeWidth : img.width();
      
      // Image and hide loader
      jMapWrap.find(".loader").remove();
      heatmap.params.imgObj.show();

      // console.log("Parent Width :: ", parentWidth);
      // console.log("Img Actual Width :: ", imgActualWidth);
      w = (parentWidth < imgActualWidth ) ? parentWidth : imgActualWidth;
      // Reduce for scroll portion
      if(RIPPLE.activeController === 'client') w = w * 0.8;
      // console.log("Calc width ::",w)
      jMapWrap.css({'width':w});

      heatmap.mapSize.set();
      callback();
    };

  },

  mapSize: function(){
    var set = function(pointsArr){
      var heatmap = RIPPLE.questionType['heatmap']
        , jMapWrap = $('#'+heatmap.params.mapWrap)
        , x = pointsArr != null ? pointsArr[0] : jMapWrap.width()
        , y = pointsArr != null ? pointsArr[1] : jMapWrap.height();

      heatmap.params.mapSize.width = x;
      heatmap.params.mapSize.height = y;
    };

    var get = function(){
      var heatmap = RIPPLE.questionType['heatmap']
        , x = heatmap.params.mapSize.width
        , y = heatmap.params.mapSize.height;
      return [x, y];
    }

    return {
      set: set,
      get: get
    }
  }(),

  loadHeatmapJS: function(callback){
    // Check to see if script has already been loaded
    if( RIPPLE.questionType['heatmap'].params.scriptLoaded === true ) {
      callback();
      return;
      // Set Cache that it has been received
      RIPPLE.questionType['heatmap'].params.scriptLoaded = true;
    }
    else {
      $.ajax({
        url:"/plugins/heatmap/js/jquery.heatmap.js", 
        dataType: "script",
        success: function(){
          callback();
        },
        error: function(jqXHR, textStatus, errorThrown){
          $jGrowl("Unable to load script. ERROR :: " + errorThrown);
        }
      });    
    }
  },

  resetObj: function(){
    // Reset ansObj
    RIPPLE.questionType['heatmap'].params.ansObj = [];
    RIPPLE.questionType['heatmap'].params.mapObj = {};
  }

};

/**
 * Session params & methods
 * @return object hooks and params for Session UI
 */
RIPPLE.questionType['heatmap'].session = function(){
  var DISPLAY = RIPPLE.session.displayController
  , ASC = RIPPLE.session.mainController
  , heatmap = RIPPLE.questionType['heatmap']
  , params = heatmap.params
  , initMap = heatmap.initMap

  var display = function (){
    var sendBtn = $('#send-btn');
    displayReset();
    heatmap.resetObj();

    // Create qOption for url
    var outputOptions = DISPLAY.createTxtInput(params.heatURLID, "Image URL");
    outputOptions = "<div class='well'>" + outputOptions + "</div>";

    DISPLAY.returnOptions(outputOptions);
    
    // Create image div
    var outputAns = "<div id='" + params.mapWrap + "' style='position:relative'></div>";
    DISPLAY.answers(outputAns);

    // Add heatmap js
    sendBtn.prop("disabled",true);
    heatmap.loadHeatmapJS(function(){
      sendBtn.prop("disabled",false);
    });

    // _bind();
  };

  var fillOptions = function(qArray){
    if(qArray != null 
      && qArray.hasOwnProperty('qOptions')  
      && qArray.qOptions.hasOwnProperty('url') ){
        $('#heatmap-url').val( qArray.qOptions.url );
    }
    
  };

  var send = function(){
    displayReset();
    heatmap.resetObj();
    
    // Create Heatmap
    var imgURL = $("#"+params.heatURLID).val();
    heatmap.params.imgSrc = imgURL
    initMap();
  };

  var recAns = function(clientID, name, answer){
    console.info("recAns args :: ",arguments);
    var total = ASC.params("total");

    // Increment Total
    newTotal = DISPLAY.incrementVal("total", total);
    ASC.params('total', newTotal);

    // Add point to map
    answer = JSON.parse(answer);
    // Convert Percentage to initial map
    // NOTE: Do not use current map dimensions because it will scale with size of mapWrap
    console.log(heatmap.params.mapSize);
    var x = heatmap.params.mapSize.width * answer.x;
    var y = heatmap.params.mapSize.height * answer.y;
    console.log("Calculated Point :: ", x, y);
    RIPPLE.questionType['heatmap'].params.mapObj.store.addDataPoint(x,y);

    // Store Data
    heatmap.params.ansObj.push([answer.x, answer.y]);

    // Add to individual responses
    var answerArray = [
      "X: " + x.toFixed(0) + "px ",
      "Y: " + y.toFixed(0) + "px "
    ]
    DISPLAY.updateIndResp(name, answerArray);
  };

  var clearAnsVals = function(){
    heatmap.resetObj();
  };

  var displayReset = function(){
    // Clear Map
    $('#' + params.mapWrap).empty();
  };
  
  var resizeAnswers = function(){
    heatmap.initMap();
  };

  return {
    displayQuestionFn: display,
    displayOptions: true,
    fillOptionsFn: fillOptions,
    sendQuestionFn: send,
    recieveAnswerFn: recAns,
    clearAnsValsFn: clearAnsVals,
    displayResetFn: displayReset,
    resizeAnswersFn: resizeAnswers
  }

};

RIPPLE.questionType['heatmap'].set = function(){
  var SC = RIPPLE.set.controller;

  var displaySetEdit = function(qTxt, qOptions){
    var html = ""
      , input = ""
      , label = "Add Image URL here...";

    // Determine if has qOption values
    var value = ( qOptions != null && qOptions.hasOwnProperty('url') ) ? qOptions.url : ""
      , optionLabel = (value) ? value : label;

    input += "<label  class='lead-label'>Image URL: </label>";
    input += "<a href='#' data-type='url' class='editable' data-name='url' data-emptytext='" + label + "'>" + value + "</a>";
    // html += "<span for='answer-heatmap-url' data-type='editable' data-for='#answer-heatmap-url'  class='answer-label show-focus' tabindex='0'>" + optionLabel + "</span>";
    // html += "<input type='textbox' id='answer-heatmap-url' name='answer-heatmap-url' value='" + value + "' class='answer-option' data-dbKey ='qOptions' data-dbOptionIndex='url' />";
    input = "<div>" + input + "</div>";
    html += input;
    html = "<div class='controls'>" + html + "</div>";

    return html;
  };

  return {
    displaySetEditFn: displaySetEdit
  }
};

RIPPLE.questionType['heatmap'].client = function(){
  var CC = RIPPLE.client.controller
    , heatmap = RIPPLE.questionType['heatmap']
    , createMap = heatmap.createMap
    , initMap = heatmap.initMap
    , click = {}
    , sendBtn = $('#send-button')
    , timer = 0;

  var display = function( questionObj ){
    console.log("heatmap.client.displayFn args ::",arguments);

    // Set heatmap initial params
    heatmap.resetObj();
    heatmap.params.imgSrc = questionObj.qOptions[0]["value"]
    heatmap.params.questionObj = questionObj;

    // Add instructions
    var html = "<div class='well well-small'>Click on the image to indicate a location.</div>";

    // Add wrapper
    html += "<div id='" + heatmap.params.mapWrap + "' style='position:relative;'></div><br />";
    CC.showAnswer(html);
    _wireupMap(questionObj);
  };

  var _bindClick = function(){
    // Bind Click Event to map
    // console.log(heatmap.params.mapObj.get("canvas"));
    heatmap.params.mapObj.get("canvas").onclick = function(e){
      _mapClick(e, this);
    }        

    sendBtn.show();    
  };

  var _wireupMap = function( questionObj ){
    // console.log("heatmap.client.displayFn args ::",arguments);
    heatmap.loadHeatmapJS(function(){
      initMap({
        completed: _bindClick
      });
    }); 
       
  };

  var _mapClick = function(e, elem){
    var params = heatmap.params
      , offset = $(elem).offset()
      , x = e.clientX - offset.left
      , xPercent = x / $('#'+ params.mapWrap).width()
      , y = e.clientY - offset.top
      , yPercent = y / $('#'+ params.mapWrap).height();

    // Clear Map
    params.mapObj.clear();
    params.ansObj = [];

    // Round to 4 decimals
    click.x = xPercent.toFixed(4);
    click.y = yPercent.toFixed(4); 
    console.log("Click :: ", click);

    // Set input values
    params.ansObj.push([click.x, click.y]);

    // Highlight Map
    params.mapObj.store.addDataPoint(x,y);    
  };

  var send = function(){
    var jMapWrap = $('#'+heatmap.params.mapWrap)
      , data = {}, stringifyData;
    CC.answer = "A hotspot";
    // Compile Answer
    data.answer = JSON.stringify(click)
    data.qID = heatmap.params.questionObj.qID;
    now.distributeAnswer( data );
    sendBtn.hide();
  };

  var valid = function(){
    var errMsg = null;

    // Correct Interval to 4 decimal places
    if( heatmap.params.ansObj.length === 0 ) errMsg = "Please click on the image to provide a point.";

    return errMsg || false;
  };

  var resize = function(){
    if(timer != 0 ) clearTimeout(timer);

    timer = setTimeout(function(){
      _wireupMap();
    }, 100);

  };

  return {
    displayFn: display,
    sendFn: send,
    validFn: valid,
    resizeFn: resize
  }
};

RIPPLE.questionTypeBootstrap( RIPPLE.questionType['heatmap'] );