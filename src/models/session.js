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

    
var mongoose = require ("mongoose"); 
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');
var xxhash = require('xxhash');
var _ = require('underscore');
var utils = require('../utils');
var config = require('../config.js');
var log = config.getLogger();

var setName = function(name) {
	return _.escape(name).trim();
}

var SessionSchema = new mongoose.Schema({
  owner: 	{
			type: Schema.ObjectId,
			required: true,
			ref: 'Player'
		},
  ownerUsername: {
              		type: String,
			required: true,
			trim: true
		},
  name:		{
			type: String,
			required: true,
			trim: true
		},
  background:   {
			image:  String,
			x: Number,
			y: Number
		},
  tokens: 	[
			{
				image: String,
				x: Number,
				y: Number
			}
		]

});

SessionSchema.index({ owner: 1, name: 1 }, { unique: true });

var SessionPlayerSchema = new mongoose.Schema({
  sessionId:	{
			type: Schema.ObjectId,
			required: true,
			ref: 'Session'
		},
  playerId:	{
			type: Schema.ObjectId,
			required: true,
			ref: 'Player'
		}
 
});
SessionPlayerSchema.index({ sessionId: 1, playerId: 1 }, { unique: true });

var SessionLibrarySchema = new mongoose.Schema({
  sessionId:	{
			type: Schema.ObjectId,
			required: true,
			ref: 'Session'
		},
  playerId:	{
			type: Schema.ObjectId,
			required: true,
			ref: 'Player'
		},
  name:		{
			type: String,
			required: true,
			trim: true
		},  
  type:		{
			type: String,
			required: true,
			trim: true
		},  
  publicPath:   {
			type: String,
			required: true,
			trim: true
                }
 
});
SessionLibrarySchema.index({ publicPath: 1 }, { unique: true });

var SessionLogSchema = new mongoose.Schema({
  sessionId:	{
			type: Schema.ObjectId,
			required: true,
			ref: 'Session'
		},
  events: 	[
			{
				type: String,
				time: 	{	
						type: Date,
						'default': Date.now
				      	},
				token: String,
				originalX: Number,
				originalY: Number,
				x: Number,
				y: Number
			}
		]

});

SessionSchema.statics.findByNameOwner = function(name, owner, callback) {
	return SessionModel.findOne(
	{
		name: new RegExp('^' + name + '$', 'i'),
		ownerUsername: owner
	}, callback);
};

SessionPlayerSchema.statics.findPlayerGamePermission = function(playerId, sessionId, callback) {
	return SessionPlayerModel.findOne(
	{
		sessionId: sessionId,	
		playerId: playerId
	}, callback );
};

SessionLibrarySchema.statics.findByPublicPath = function(publicPath, callback) {
	return SessionLibraryModel.findOne(
	{
		publicPath: publicPath
	}, callback );      
};

var SessionModel = mongoose.model('Session', SessionSchema);
var SessionPlayerModel = mongoose.model('SessionPlayers', SessionPlayerSchema);
var SessionLibraryModel = mongoose.model('SessionLibrary', SessionLibrarySchema);
var SessionLogModel = mongoose.model('SessionLog', SessionLogSchema);
module.exports.sessionModel = SessionModel;
module.exports.sessionPlayerModel = SessionPlayerModel;
module.exports.sessionLibraryModel = SessionLibraryModel;
module.exports.sessionLogModel = SessionLogModel;
module.exports.sessionSchema = SessionSchema;
module.exports.sessionPlayerSchema = SessionPlayerSchema;
module.exports.sessionLibrarySchema = SessionLibrarySchema;
module.exports.sessionLogSchema = SessionLogSchema;
