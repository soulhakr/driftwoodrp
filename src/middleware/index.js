/**
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License. 
**/

var config = require('../config.js');
var models = require('../models');
var mongoose = require('mongoose');

var log = config.getLogger();

var authPrompt = function(req, res) {
  var title = 'Requires authentication';
  var message = 'Requires authentication';

  if (req.xhr) {
    return res.unauthorized();
  }
  res.redirect('/login?redirect=' + encodeURIComponent(req.url));
};

//var authOwner = function(req, res) {
//  var title = 'Requires ownership';
//  var message = 'Only ' + req.params.player + ' can do that';
//  if (req.xhr) {
//    return res.forbidden(message);
//  }
//  req.flash('message', {
//    name: title,
//    message: message,
//    alert: 'alert'
//  });
//  res.redirect('/');
//};

var getPermission = function(playerId, gameId, callback) { 
	models.Session.sessionPlayerModel.findPlayerGamePermission(playerId, gameId, function(err, doc) {
		callback(err, doc);
	});
};

var findGame = function(gameName, player, callback) {
	models.Session.sessionModel.findByNameOwner(gameName, player, function(err, doc) {
		callback(err, doc);
	});
};

//////////////////////////////////////////////////////////////////////////////
var attachHandlers = function(config) {

//  var notFound = function(req, res, next) {
//    res.err(new Error('Resource not found'), 404);
//  };

//  var serverError = function(err, req, res, next) {
//    log.error(util.formatErr(err));
//    res.err(err, 500);
//  };


  var csrf = function(req, res, next) {
    if(config.getConfig().environment !== 'test') {
      res.locals.token = req.session._csrf;
    } else {
      res.locals.token = null;
    }
    next();
  };

  var requiresOwnership = function(req, res, next) {
	var isOwner = req.params.player.toLowerCase() === req.session.player.username.toLowerCase();
	
	if(!isOwner) {
		return res.json("forbidden");
	}
	attachPlayer(req, res, next);
  };

  var requiresPermission = function(req, res, next) {
	getPermission(req.session.player.id, res.locals.game.id, function(err, doc) {
		if(err) {
			return next(err);
		}
		if(!doc) {
			return res.json("document was not found");
		}
		next();
	});
  };

  var attachPlayer = function(req, res, next) {
    models.Player.playerModel.findByUsername(req.params.player, function(err, doc) {
      if (err) {
        return next(err);
      }
      if (!doc) {
        return res.json('User was not found');
      }
      res.locals.player = doc;
      next();
    });
  };

  var attachGame = function(req, res, next) {
	findGame(req.params.gameName, req.params.player, function(err, doc) {
		if(err) {
			return next(err);
		}

		if(!doc) {
			return res.json('game was not found');
		}

		res.locals.game = doc;
		requiresPermission(req, res, next);
	});
  };


  var requiresAuth = function(req, res, next) {
    if (req.session && req.session.player) {
      return next();
    }
    authPrompt(req, res);
  };


//  var requiresNoAuth = function(req, res, next) {
//    if (req.session && req.session.player) {
//      return noAuthPrompt(req, res);
//    }
//    next();
//  };

  var requests = function(req, res, next) {
    req.isAuthenticated = !!(req.session && req.session.player);
    next();
  };

//  // Attach custom req/res functionality here
  var responses = function(req, res, next) {
    res.locals.session = req.session;

    res.err = function(err, code) {
      code = code || 500;
      if (typeof(err) === 'string') {
        err = new Error(err);
      }

      if (req.xhr) {
        return res.json(code, {
          err: {
            name: err.name,
            message: err.message
          }
        });
      }
      res.render('error', {
        title: "Error",
        code: code,
        err: err
      });
    };

    res.notFound = function(message) {
      res.err({
        name: 'Not found',
        message: message + ' not found'
      }, 404);
    };

    res.badRequest = function(message) {
      res.err({
        name: 'Bad request',
        message: message
      }, 400);
    };

    res.unauthorized = function(message) {
      res.err({
        name: 'Unauthorized',
        message: message || "Unauthorized"
      }, 401);
    };

    res.forbidden = function(message) {
      res.err({
        name: 'Forbidden',
        message: message || 'Forbidden'
      }, 403);
    };

    res.conflict = function(message) {
      res.err({
        name: 'Conflict',
        message: message || 'Conflict'
      }, 409);
    };

    res.created = function(entity) {
      var message = entity + ' created';
      if (req.xhr) {
        return res.json(201, {
          response: message
        });
      }
      res.send(message, 201);
    };

    res.updated = function(entity) {
      var message = entity + ' updated';
      if (req.xhr) {
        return res.json(200, {
          response: message
        });
      }
      res.send(message, 200);
    };

    next();
  };

//  return {
//    requests: requests,
//    responses: responses,
//    notFound: notFound,
//    serverError: serverError,
//    csrf: csrf,
//    requiresAuth: requiresAuth,
//    requiresNoAuth: requiresNoAuth,
//    attachUser: attachUser
//  };

    return {
	requests: requests,
        responses: responses,
        csrf: csrf,
	requiresOwnership: requiresOwnership,
	requiresPermission: requiresPermission,
        requiresAuth: requiresAuth,
	attachPlayer: attachPlayer,
	attachGame: attachGame
    };
};

module.exports.attachHandlers = attachHandlers;
module.exports.getPermission = getPermission;
module.exports.findGame = findGame;