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


var models = require('../models');
var async = require('async');
var fs = require('fs');
var mongoose = require ("mongoose"); 
var async = require('async');
var Schema = mongoose.Schema;
var config = require('../config.js');
var xxhash = require('xxhash');
var log = config.getLogger();
var utils = require('../utils');

var joinSessionPage = function(req, res) {
	var player = res.locals.player;
	var conditions = {
		playerId: player.id
	}
	
	models.Session.sessionPlayerModel.find(conditions).exec(function(err, docs) {
		var ids = docs.map(function(doc) { return doc.sessionId; });

		models.Session.sessionModel.find({_id: {$in: ids}}).exec(function(err, games) {
			res.render('lobby', {title: 'Lobby', games: games});
		});
	});
};

var createSession = function(req, res){
	var player = res.locals.player;
	var gameName = req.body.name;
	
	if(!gameName || !player) {
		return res.badRequest("Game name is required");
	}

	models.Session.sessionModel.findByNameOwner(gameName, player.id, function(err, doc) {
		if(err) {
			return res.err('an error occurred creating a game');
		}

		if(doc)
		{
			return res.conflict('a game with the same name already exists');
		}

		log.info('creating game ' + gameName + ' for player ' + player.username);
		// Creating one game.
		var newGame = new models.Session.sessionModel({
		  owner: player.id,
		  ownerUsername: player.username,
		  name: gameName
		});

		// Saving it to the database.  
		newGame.save(function(err) {
			if(err) {
				return res.err('an error occurred creating a game');
			}

			var gameId = newGame.id;	

			var newGamePlayer = new models.Session.sessionPlayerModel({
				sessionId: gameId,
				playerId: player.id
			});

			newGamePlayer.save(function(err) {
				if(err) {
					return res.err('an error occurred adding the player to the game');
				}

				res.redirect('/joinGame/' + player.username);
			});
		});
		
	});
};

var loadSession = function(req, res) {
	var game = res.locals.game;

	res.render('game', {url: config.getConfig().liveUrl, title: game.name, game: game});
};

var addPlayer = function(req, res) {
	var playerUsername = req.body.username;
	var game = res.locals.game;
	
	if(!playerUsername) {
		return res.badRequest("A player's username is required");
	}

	if(playerUsername.toLowerCase() === game.ownerUsername.toLowerCase()) {
		return res.badRequest("You are already added to the game");
	}

	models.Player.playerModel.findByUsername(playerUsername, function(err, newPlayer){

		if(err || !newPlayer){
			return res.notFound("player could not be found");
		}

		var newGamePlayer = new models.Session.sessionPlayerModel({
			sessionId: game.id,
			playerId: newPlayer.id
		});

		newGamePlayer.save(function(err) {
			if(err) {
				return res.err('an error occurred adding the player to the game');
			}

			res.created(newPlayer.username + " was added to the game");
		});
	});
};

var removePlayer = function(req, res) {
	var playerUsername = req.body.username;
	var game = res.locals.game;
	
	if(!playerUsername) {
		return res.badRequest("A player's username is required");
	}

	if(playerUsername.toLowerCase() === game.ownerUsername.toLowerCase()) {
		return res.badRequest("You cannot remove yourself from your own game");
	}

	models.Player.playerModel.findByUsername(playerUsername, function(err, existingPlayer){

		if(err || !existingPlayer){
			return res.notFound("player could not be found");
		}

		models.Session.sessionPlayerModel.findPlayerGamePermission(existingPlayer.id, game.id, function(err, permission){
			if(err) {
				log.error(err);
				return res.forbidden("player does not have permission to this game");
			}

			if(!permission) {
				return res.fobidden("player does not have permission to this game");
			}

			permission.remove();

			res.updated(existingPlayer.username + " was removed from the game");
		});
	});
};

var uploadBackground = function(req, res) {
	res.json('request to upload a background image');
};

var removeBackground = function(req, res) {
	res.json('request to remove a background image');
};

var uploadToken = function(req, res) {
        if(!(req.files && req.files.assetFile)){
	  return res.badRequest('Only valid image formats are accepted');
        }

        var date = new Date();
 	var publicPath = date.getMilliseconds();
        publicPath = publicPath + '' + xxhash.hash(new Buffer(req.session.player.id), 0xCEADBF78);
        publicPath = publicPath + '' + xxhash.hash(new Buffer(res.locals.game.id), 0xCEADBF78);
        publicPath = publicPath + '' + xxhash.hash(new Buffer(req.files.assetFile.name), 0xCEADBF78);

        var newToken = new models.Session.sessionLibraryModel({
          sessionId: res.locals.game.id,
          playerId: req.session.player.id,
          name: req.files.assetFile.name,
          type: 'token',
          publicPath: publicPath
        });

        newToken.save(function(err) {
          if(err) {
            return res.err('Token failed to upload, please try again');
          }

           async.parallel({
             main: function(asyncCallback) {
               utils.uploadModule.uploadAsset(req.files.assetFile, publicPath, asyncCallback);
	    },/////
             thumb: function(asyncCallback) {
               var thumb = new utils.imageModule.Image(req.files.assetFile.path);
               thumb.resize(config.getConfig().specialConfigs.imageSize.thumb, function(err){
                 if(err) {
                   return asyncCallback(err);
                 }

                 thumb.uploadStream(publicPath + config.getConfig().specialConfigs.imageSize.thumb.type, asyncCallback); 
               });
             } 
           }, function(err) { 
              if(err) {
                newToken.remove(function(err) {
                  if(err) {
                   log.error('Failed to remove session library token ' + publicPath);
                  }
	        });

                return res.err(err);  
               }

               res.json('File uploaded to game library');               
           });
        });
};

var removeToken = function(req, res) {
	if(!req.body.assetFile){
	  return res.badRequest('The token to remove was not specified');
        }

        models.Session.sessionLibraryModel.findByPublicPath(req.body.assetFile, function(err, doc){
          if(err || !doc){
	    return res.notFound("Token was not found in the game library");
          }

          utils.uploadModule.removeAsset(req.body.assetFile, function(err, status) {
             
            if(err) {
              res.json('Token was not removed from the game library. Please try again.');
            }

            res.json('Token was removed from the game library');
	  });
       });

};

var saveDrawing = function(req, res) {
	res.json('request to save the current drawing');
};

var saveEvent = function(req, res) {
	res.json('request to save an event');
};

var loadEvents = function(req, res) {
	res.json('request to load an event');
};

module.exports.joinSessionPage = joinSessionPage;
module.exports.createSession = createSession;
module.exports.loadSession = loadSession;
module.exports.addPlayer = addPlayer;
module.exports.removePlayer = removePlayer;
module.exports.uploadBackground = uploadBackground;
module.exports.removeBackground = removeBackground;
module.exports.uploadToken = uploadToken;
module.exports.removeToken = removeToken;
module.exports.saveDrawing = saveDrawing;
module.exports.saveEvent = saveEvent;
module.exports.loadEvents = loadEvents;
