var express = require('express');
var router = express.Router();
var path    = require("path");
var fs = require('fs');
var cheerio = require('cheerio');

// Get Homepage
router.get('/', ensureAuthenticated, function(req, res){
	var htmlPath = '/home/ubuntu/workspace/views/index.html';
	var outPath = '/home/ubuntu/workspace/views/index.html';
	
	fs.readFile(htmlPath, {encoding: 'utf8'}, function(error, data) {
	    var $ = cheerio.load(data); 
	    $('.' + 'plaquirris').html(req.user.placas);
	    
	    fs.writeFile(outPath, $.html());
	});
	res.redirect('/index');
});

router.get('/index', ensureAuthenticated, function(req, res){
	res.sendFile("index.html", {"root": '/home/ubuntu/workspace/views'});
});

router.get('/admin', ensureAuthenticated, ensureAuthenticatedAdmin, function(req, res){
	res.render('index');
});

router.get('/multas', ensureAuthenticated, function(req, res){
	res.sendFile("multas.html", {"root": '/home/ubuntu/workspace/views'});
});

router.get('/pago', ensureAuthenticated, function(req, res){
	res.sendFile("pago.html", {"root": '/home/ubuntu/workspace/views'});
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/users/login');
	}
}

function ensureAuthenticatedAdmin(req, res, next){
	if(req.user.username == 'admin'){
		return next();
	} else {
		//req.flash('error_msg','You are not logged in');
		res.redirect('/');
	}
}

module.exports = router;