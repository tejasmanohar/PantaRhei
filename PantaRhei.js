// Generated by CoffeeScript 1.3.3

/* 
	PantaRhei.js v 0.0.1
	
	(c) 2012 Federico Weber
	distributed under the MIT license.
	federicoweber](http://federicoweber.com)
*/


(function() {
  var Backbone, Flow, JsonLoader, LoadAssets, PantaRhei, VERSION, Worker, root, workers, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  root = this;

  PantaRhei = {};

  if ((typeof exports !== "undefined" && exports !== null)) {
    PantaRhei = exports;
    _ = require('underscore');
    Backbone = require('backbone');
  }

  if (root.Backbone != null) {
    Backbone = root.Backbone;
    _ = root._;
  }

  if (Backbone === void 0) {
    throw "Please import Backbone to use this library";
  }

  root.PantaRhei = PantaRhei;

  VERSION = PantaRhei.VERSION = "0.0.1";

  Flow = PantaRhei.Flow = (function() {

    function Flow(id, queue) {
      this.id = id != null ? id : _.uniqueId('flow_');
      this.queue = queue != null ? queue : new Array();
      this._currentWorker = {};
      return this;
    }

    Flow.prototype.use = function(worker) {
      if (_.isFunction(worker.run) || _.isFunction(worker)) {
        this.queue.push(worker);
      } else {
        throw new Error("Provide a proper worker");
      }
      return this;
    };

    Flow.prototype.run = function(shared) {
      this.shared = shared != null ? shared : {};
      if (this.queue.length === 0) {
        throw new Error("The workers queue is empty");
      } else {
        this._paused = false;
        this._runningQueue = _.clone(this.queue);
        this._runningQueue.reverse();
        this.trigger('run', this.shared);
        this._next();
      }
      return this;
    };

    Flow.prototype.pause = function() {
      this._paused = true;
      this.trigger('pause', this.shared);
      return this;
    };

    Flow.prototype.resume = function() {
      this._paused = false;
      this.trigger('resume', this.shared);
      this._next();
      return this;
    };

    Flow.prototype.kill = function() {
      return this;
    };

    Flow.prototype._next = function(error) {
      var cNext;
      if (this._currentWorker && _.isFunction(this._currentWorker.kill)) {
        this._currentWorker.kill();
      }
      if (error) {
        this.pause();
        return this.trigger('error', error);
      } else if (this._runningQueue.length > 0) {
        this._currentWorker = this._runningQueue.pop();
        if (this._currentWorker && _.isFunction(this._currentWorker.run)) {
          cNext = _.bind(this._next, this);
          this.trigger('step', this.shared, this._currentWorker);
          return this._currentWorker.run(this.shared, cNext);
        } else if (this._currentWorker && _.isFunction(this._currentWorker)) {
          cNext = _.bind(this._next, this);
          return this._currentWorker(this.shared, cNext);
        } else {
          throw new Error("The " + this._currentWorker.id + " worker does not provide a run method");
        }
      } else {
        return this.trigger('complete', this.shared);
      }
    };

    return Flow;

  })();

  _.extend(Flow.prototype, Backbone.Events);

  Worker = PantaRhei.Worker = (function() {

    function Worker(id) {
      this.id = id != null ? id : _.uniqueId('worker_');
    }

    Worker.prototype.run = function(shared, next) {
      this.shared = shared;
      this.next = next;
      return this.next(new Error('run must be overridden'));
    };

    Worker.prototype.kill = function() {
      throw new ReferenceError("kill must be overridden ");
    };

    return Worker;

  })();

  _.extend(Worker.prototype, Backbone.Events);

  Flow.extend = Worker.extend = Backbone.View.extend;

  workers = PantaRhei.workers = {};

  JsonLoader = workers.JsonLoader = (function(_super) {

    __extends(JsonLoader, _super);

    function JsonLoader(jsonUrl, id) {
      this.jsonUrl = jsonUrl;
      this.id = id != null ? id : _.uniqueId('jsonLoader_');
      this.jsonUrl = this.jsonUrl + '?ran=' + Math.random() * 999999;
    }

    JsonLoader.prototype.run = function(shared, next) {
      var that;
      this.shared = shared;
      this.next = next;
      that = this;
      if (this.jsonUrl != null) {
        return $.getJSON(this.jsonUrl, function() {}).success(function(data, textStatus, jqXHR) {
          if (!that.shared.jsonData) {
            that.shared.jsonData = new Array();
          }
          that.shared.jsonData[that.id] = data;
          return that.next();
        }).error(function(XMLHttpRequest, textStatus, errorThrown) {
          that.shared.loadedData = null;
          that.shared.errorThrown = errorThrown;
          that.shared.XMLHttpRequest = XMLHttpRequest;
          return that.next(new Error(textStatus));
        });
      } else {
        return next(new Error('Please provide an url'));
      }
    };

    JsonLoader.prototype.kill = function() {};

    return JsonLoader;

  })(Worker);

  LoadAssets = workers.LoadAssets = (function(_super) {

    __extends(LoadAssets, _super);

    function LoadAssets(assets, id) {
      this.assets = assets;
      this.id = id != null ? id : _.uniqueId('assetsLoader_');
    }

    LoadAssets.prototype.run = function(shared, next) {
      var numLoaded, onError, onLoad, that, totalNum;
      this.shared = shared;
      this.next = next;
      that = this;
      if (_.isArray(this.assets)) {
        totalNum = this.assets.length;
        numLoaded = 0;
        onError = function() {
          return that.next(new Error("Error loading the asset"));
        };
        onLoad = function() {
          numLoaded += 1;
          if (numLoaded === totalNum) {
            that.shared.assetsPreloaded = true;
            return that.next();
          }
        };
        return _.each(this.assets, function(url) {
          var img;
          img = new Image();
          img.onload = onLoad;
          img.onerror = onError;
          return img.src = url;
        });
      } else {
        return next(new Error('Please provide some assets'));
      }
    };

    LoadAssets.prototype.kill = function() {};

    return LoadAssets;

  })(Worker);

}).call(this);
