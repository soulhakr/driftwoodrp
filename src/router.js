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
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var router = function(app, controllers, mid) {
	if(config.getConfig.environment !== 'test'){
		app.use(express.csrf());
	}
 
  app.use(mid.requests);
	app.use(mid.responses);

  app.use(passport.initialize());

  var clientID = config.getConfig().specialConfigs.googleClientID;
  var clientSecret = config.getConfig().specialConfigs.googleClientID;
  var liveURL = config.getConfig().liveUrl;
  var callbackURL = config.getConfig().specialConfigs.googleCallbackURL;
  var scopes = config.getConfig().specialConfigs.googleScopes;

  if(!clientID || !clientSecret || !liveURL || !callbackURL || !scopes) {
    logger.error("Missing Google Auth configuration for Google Auth module. Missing key googleClientID, googleClientSecret or googleCallbackURL, googleScopes or master config liveURL");
    process.exit(5);
  }

  var google = new GoogleStrategy({
    clientID: config.getConfig().specialConfigs.googleClientID,
    clientSecret: config.getConfig().specialConfigs.googleClientID,
    callbackURL: liveURL + callbackURL,
    scopes: scopes
  }, 
  function(accessToken, refreshToken, profile, callback) {
    log.info(accessToken);
    log.info(refreshToken);
    log.info(profile);
    log.info(callback);
  });

  passport.use(google);

  app.get('/auth/google', passport.authenticate('google', { scope: scopes }));
  app.get(config.getConfig().specialConfigs.googleCallbackURL, passport.authenticate('google', { successRedirect: '/', failureRedirect: '/' }));

	app.get('/test/test', controllers.Sessions.test);
	app.get('/', mid.requiresNoAuth, controllers.Players.loginPage);
	app.get('/login', mid.requiresNoAuth, controllers.Players.loginPage);
	app.post('/login', mid.requiresNoAuth, controllers.Players.login);
  app.get('/logout', controllers.Players.logout);
  app.post('/logout', controllers.Players.logout);
  app.get('/createAccount', mid.requiresNoAuth, controllers.Players.registerPage);
	app.post('/createAccount', mid.requiresNoAuth, controllers.Players.createAccount);
  app.get('/resetPassword', controllers.Players.resetPasswordPage);
  app.post('/resetPassword',  controllers.Players.resetPassword);
	app.post('/changePassword', mid.requiresAuth, controllers.Players.changePassword);	
	app.get('/joinGame/:player', mid.requiresAuth, mid.requiresOwnership, controllers.Sessions.joinSessionPage);
	app.post('/createGame/:player', mid.requiresAuth, mid.requiresOwnership, controllers.Sessions.createSession);
	app.get('/game/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.loadSession);
	app.post('/addPlayer/:player/:gameName', mid.requiresAuth, mid.requiresOwnership, mid.attachGame, controllers.Sessions.addPlayer);
	app.post('/removePlayer/:player/:gameName', mid.requiresAuth, mid.requiresOwnership, mid.attachGame, controllers.Sessions.removePlayer);
  app.post('/addGM/:player/:gameName', mid.requiresAuth, mid.requiresOwnership, mid.attachGame, controllers.Sessions.addGM);
	app.post('/removeGM/:player/:gameName', mid.requiresAuth, mid.requiresOwnership, mid.attachGame, controllers.Sessions.removeGM);
	app.post('/uploadToken/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.uploadToken);
	app.post('/removeToken/:player/:gameName', mid.requiresAuth, mid.attachGame, controllers.Sessions.removeToken);
};

module.exports = router;
