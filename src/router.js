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

var config = require('./config');
var express = require('express');

var router = function(app, controllers, mid) {
	if(config.getConfig.environment !== 'test'){
		app.use(express.csrf());
	}
 
        app.use(mid.requests);
	app.use(mid.responses);

	app.get('/', controllers.Players.loginPage);
	app.get('/login', controllers.Players.loginPage);
	app.post('/login', controllers.Players.login);
  	app.get('/logout', controllers.Players.logout);
  	app.post('/logout', controllers.Players.logout);
	app.post('/createAccount', controllers.Players.createAccount);
        app.post('/resetPassword',  controllers.Players.resetPassword);
	app.post('/changePassword', mid.requiresAuth, controllers.Players.changePassword);	
	app.get('/joinGame/:player', mid.requiresAuth, mid.requiresOwnership, controllers.Sessions.joinSessionPage);
	app.post('/createGame/:player', mid.requiresAuth, mid.requiresOwnership, controllers.Sessions.createSession);
	app.get('/game/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.loadSession);
	app.post('/addPlayer/:player/:gameName', mid.requiresAuth, mid.requiresOwnership, mid.attachGame, controllers.Sessions.addPlayer);
	app.post('/removePlayer/:player/:gameName', mid.requiresAuth, mid.requiresOwnership, mid.attachGame, controllers.Sessions.removePlayer);
	app.post('/uploadBackground/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.uploadBackground);
	app.post('/removeBackground/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.removeBackground);
	app.post('/uploadToken/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.uploadToken);
	app.post('/removeToken/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.removeToken);
	app.post('/saveDrawing/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.saveDrawing);
	app.post('/saveEvent/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.saveEvent);
	app.get('/loadEvents/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.loadEvents);

};

module.exports = router;