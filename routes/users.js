var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var futures = require('futures');
var sequence = futures.sequence();
var fs = require('fs');
var cheerio = require('cheerio');

var User = require('../models/user');
var Parqueaderos = require('../models/parqueadero');
var Car = require('../models/car');
var Multa = require('../models/multa');

// Register
router.get('/register', function(req, res){
	res.render('register');
});

router.get('/ingresar', ensureAuthenticated, ensureAuthenticatedAdmin, function(req, res){
	res.render('ingresar');
});

router.get('/salir', ensureAuthenticated, ensureAuthenticatedAdmin, function(req, res){
	res.render('salir');
});

// Login
router.get('/login', function(req, res){
	res.render('login');
});

// Register User
router.post('/register', function(req, res){
	var name = req.body.name;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var password2 = req.body.password2;
	var placas = req.body.placas;

	// Validation
	req.checkBody('name', 'Se requiere un nombre').notEmpty();
	req.checkBody('email', 'Se requiere un email').notEmpty();
	req.checkBody('email', 'El email ingresado no es valido').isEmail();
	req.checkBody('username', 'Se requiere un usuario').notEmpty();
	req.checkBody('password', 'Se requiere una contraseña').notEmpty();
	req.checkBody('password2', 'Las contraseñas no coinciden').equals(req.body.password);
	req.checkBody('placas', 'Se requiere ingresar las placas de su vehiculo').notEmpty();

	var errors = req.validationErrors();

	if(errors){
		res.render('register',{
			errors:errors
		});
	} else {
		var newUser = new User({
			name: name,
			email:email,
			username: username,
			password: password,
			placas: placas
		});
		
		console.log(newUser);

		User.createUser(newUser, function(err, user){
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'Se ha registrado tu información exitosamente, puedes iniciar sesión');

		res.redirect('/users/login');
	}
});

router.post('/ingresar', function(req, res){
	var placas = req.body.placas;
	var today = new Date();
	var hora = today.getHours();
	var minutos = today.getMinutes();
	var dia = today.getDay();
	var mes = today.getMonth();
	var semana = getWeekNumber(today);
	var fecha = (hora*60)+minutos;
	var lugar = req.body.lugar;
	var hora1 = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()+ ' ' +today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

	// Validation
	req.checkBody('placas', 'Se requieren las placas del vehiculo que ingresa').notEmpty();
	req.checkBody('lugar', 'Se requiere definir un lugar de parqueo').notEmpty();
	
	var errors = req.validationErrors();

	if(errors){
		res.render('ingresar',{
			errors:errors
		});
	} else {
		User.getUserByPlates(placas, function(err, user){
			console.log(placas);
			if(err) throw err;
			if(!user){
				req.flash('error_msg', 'El carro no se encuentra registrado en la universidad');

				res.redirect('/admin');
			} else{
				Multa.getMultaByPlates(placas, function(err, multa){
					if(err) throw err;
					if(!multa){
						var newCar = new Car({
							placas: placas,
							fecha: fecha,
							lugar: lugar,
							hora: hora1
						});
				
						Car.ingresarCarro(newCar, function(err, car){
							if(err) throw err;
							console.log(car);
						});
						Parqueaderos.getParqueadero(dia, mes, semana, lugar, function(err, parq){
							if(err) throw err;
							if(!parq){
								var newParqueadero = new Parqueaderos({
									dia: dia,
									semana: semana,
									mes: mes,
									ocupados: 1,
									lugar: lugar
								});
								
								Parqueaderos.ingresarParqueadero(newParqueadero, function(err, parqueadero) {
								    if(err) throw err;
								})
								
							} else{
								var ocupados = parq.ocupados + 1;
								Parqueaderos.update({dia:dia, mes:mes, semana:semana, lugar:lugar},{ocupados: ocupados}, function(err){
									if(err) throw err;
								});
							}
						});
				
						req.flash('success_msg', 'Se ha registrado el ingreso del carro');
				
						res.redirect('/admin');
					} else {
						req.flash('error_msg', 'El usuario aun tiene una multa vigente');
				
						res.redirect('/admin');
					}
				});
			}
		});
	}
});

router.post('/adminmulta', function(req, res){
	var placas = req.body.placas;
	var infraccion = req.body.infraccion;
	var lugar = req.body.lugar;
	var pic = req.body.pic;

	// Validation
	req.checkBody('placas', 'Se requiere ingresar las placas del vehiculo').notEmpty();
	req.checkBody('pic', 'Se requiere una imagen que muestre la infracción').notEmpty();

	var errors = req.validationErrors();

	if(errors){
		res.render('multaadmin',{
			errors:errors
		});
	} else {
		var today = new Date();
		var dia =today.getDate();
		var mes = (today.getMonth()+1);
		var year = today.getFullYear();
		
		var newMulta = new Multa({
			placas: placas,
			dia: dia,
			mes: mes,
			year: year,
			infraccion: infraccion,
			lugar: lugar,
			imagen: pic
		});
		
		console.log(newMulta);

		Multa.ingresarMulta(newMulta, function(err, user){
			if(err) throw err;
			console.log(user);
		});

		req.flash('success_msg', 'Se ha registrado la multa');

		res.redirect('/admin');
	}
});

router.get('/multas', ensureAuthenticated, function(req, res) {
    Multa.getMultaByPlates(req.user.placas, function(err, multa){
    	if(err) throw err;
			if(!multa){
				var htmlPath = '/home/ubuntu/workspace/views/multas.html';
				var outPath = '/home/ubuntu/workspace/views/multas.html';
				
				fs.readFile(htmlPath, {encoding: 'utf8'}, function(error, data) {
				    var $ = cheerio.load(data); 
				    $('.' + 'multa1').html('No hay multas');
				    $('.' + 'multa2').html('Felicitaciones!');
				    $('.' + 'multa3').html(' ');
				    $('.' + 'multa4').html(' ');
				    
				    fs.writeFile(outPath, $.html());
				});
				
				res.redirect('/users/multas1');
			} else{
				
				var htmlPath = '/home/ubuntu/workspace/views/multas.html';
				var outPath = '/home/ubuntu/workspace/views/multas.html';
				
				fs.readFile(htmlPath, {encoding: 'utf8'}, function(error, data) {
				    var $ = cheerio.load(data); 
				    $('.' + 'multa1').html('Multa 1');
				    $('.' + 'multa2').html('Fecha Multa: ' + multa.dia + '-' + multa.mes + '-' + multa.year);
				    $('.' + 'multa3').html('Lugar: ' + multa.lugar);
				    if (multa.infraccion == 'masparqueadero'){
				    	$('.' + 'multa4').html('Infracción: Al parquearse ocupo mas de un parqueadero');
				    } else {
				    	$('.' + 'multa4').html('Infracción: Parqueo en un lugar indebido');
				    }
				    
				    
				    fs.writeFile(outPath, $.html());
				});
				
				res.redirect('/users/multas1');
			}
    });
});

router.get('/multas1', ensureAuthenticated, function(req, res) {
	res.sendFile("multas.html", {"root": '/home/ubuntu/workspace/views'});
});

router.post('/salir', function(req, res){
	var placas = req.body.placas;

	// Validation
	req.checkBody('placas', 'Se requieren las placas del vehiculo que sale').notEmpty();
	
	var errors = req.validationErrors();

	if(errors){
		res.render('salir',{
			errors:errors
		});
	} else {
		Car.getCarByPlates(placas, function(err, car){
			if(err) throw err;
			if(!car){
				req.flash('error_msg', 'El carro no se encuentra en los parqueaderos de la universidad');

				res.redirect('/admin');
			} else{
				Car.remove({placas: placas}, function(err){
					if(err) throw err;
				});
				
				req.flash('success_msg', 'Se ha registrado la salida del carro');
		
				res.redirect('/admin');
			}
		});
	}
});

router.get('/parqueaderos', ensureAuthenticated, function(req, res){
	//res.sendFile("parqueadero.html", {"root": '/home/ubuntu/workspace/views'});
	var htmlPath = '/home/ubuntu/workspace/views/parqueaderos.html';
	var outPath = '/home/ubuntu/workspace/views/parqueaderos.html';
	
	fs.readFile(htmlPath, {encoding: 'utf8'}, function(error, data) {
	    var $ = cheerio.load(data);
	    var total = 100;
	    sequence.then(function(next) {
			Car.count({ 'lugar': 'palmas'}, function (err, ocupados) {
				if(err) throw err;
				console.log('Palmas:'+ocupados);
				$('.' + 'palmas').html(total-ocupados);
			});
			next();
			})
			.then(function(next) {
			Car.count({ 'lugar': 'guayacanes'}, function (err, ocupados) {
				if(err) throw err;
				console.log('Guayacanes:'+ocupados);
				$('.' + 'guayacanes').html(total-ocupados);
			});
			next();
			})
			.then(function(next) {
			Car.count({ 'lugar': 'abc'}, function (err, ocupados) {
				if(err) throw err;
				console.log('ABC:'+ocupados);
				$('.' + 'abc').html(total-ocupados);
			});
			next();
			})
			.then(function(next) {
			Car.count({ 'lugar': 'lagobajo'}, function (err, ocupados) {
				if(err) throw err;
				console.log('Lagob:'+ocupados);
				$('.' + 'lagob').html(total-ocupados);
			});
			next();
			})
			.then(function(next) {
			Car.count({ 'lugar': 'lagoalto'}, function (err, ocupados) {
				if(err) throw err;
				console.log('Lagoa:'+ocupados);
				$('.' + 'lagoa').html(total-ocupados);
			});
			next();
			})
			.then(function(next) {
			Car.count({ 'lugar': 'profesores'}, function (err, ocupados) {
				if(err) throw err;
				console.log('Profesores:'+ocupados);
				$('.' + 'profesores').html(total-ocupados);
				fs.writeFile(outPath, $.html());
				res.redirect('parqueaderos1');
			});
			next();
			});
	});
});

router.get('/parqueaderos1', ensureAuthenticated, function(req, res) {
	res.sendFile("parqueaderos.html", {"root": '/home/ubuntu/workspace/views'});
});

router.get('/pago', ensureAuthenticated, function(req, res) {
    Car.getCarByPlates(req.user.placas, function(err, car){
    	if(err) throw err;
			if(!car){
				var htmlPath = '/home/ubuntu/workspace/views/pago.html';
				var outPath = '/home/ubuntu/workspace/views/pago.html';
				
				fs.readFile(htmlPath, {encoding: 'utf8'}, function(error, data) {
				    var $ = cheerio.load(data);
				    $('.' + 'titulo').html('Tu carro no se encuentra parqueado en la universidad');
				    $('.' + 'costoParqueadero').html(' ');
				    $('.' + 'header1').html(' ');
				    $('.' + 'fechaIngreso').html(' ');
				    $('.' + 'header2').html(' ');
				    $('.' + 'fechaActual').html(' ');
				    
				    fs.writeFile(outPath, $.html());
				});
				
				res.redirect('/users/pago1');
			} else{
				var today = new Date();
				var hora = today.getHours();
				var minutos = today.getMinutes();
				var fecha = (hora*60)+minutos;
				var costo = 4*(fecha - car.fecha);
				var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
				var day = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
				
				var htmlPath = '/home/ubuntu/workspace/views/pago.html';
				var outPath = '/home/ubuntu/workspace/views/pago.html';
				
				fs.readFile(htmlPath, {encoding: 'utf8'}, function(error, data) {
				    var $ = cheerio.load(data); 
				    $('.' + 'titulo').html('De acuerdo al dia de hoy el costo del parqueadero es de:');
				    $('.' + 'costoParqueadero').html(costo + ' pesos');
				    $('.' + 'header1').html('Hora de Ingreso a la Universidad:');
				    $('.' + 'fechaIngreso').html(car.hora);
				    $('.' + 'header2').html('Hora actual:');
				    $('.' + 'fechaActual').html(time + ' ' + day);
				    
				    fs.writeFile(outPath, $.html());
				});
				
				res.redirect('/users/pago1');
			}
    });
});

router.get('/pago1', ensureAuthenticated, function(req, res) {
	res.sendFile("pago.html", {"root": '/home/ubuntu/workspace/views'});
});

router.get('/adminmulta', ensureAuthenticated, ensureAuthenticatedAdmin, function(req, res) {
	res.render("multaadmin");
});

router.get('/estadisticas', ensureAuthenticated, function(req, res) {
	res.sendFile("estadisticas.html", {"root": '/home/ubuntu/workspace/views'});
});



passport.use(new LocalStrategy(
  function(username, password, done) {
   User.getUserByUsername(username, function(err, user){
   	if(err) throw err;
   	if(!user){
   		return done(null, false, {message: 'El usuario ingresado no existe'});
   	}

   	User.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		} else {
   			return done(null, false, {message: 'Contraseña Invalida'});
   		}
   	});
   });
  }));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.post('/login',
  passport.authenticate('local', {failureRedirect:'/users/login',failureFlash: true}),
  function(req, res) {
  	if (req.user.username == 'admin'){
  		res.redirect('/admin');
  	} else{
  		res.redirect('/');	
  	}
  });

router.get('/logout', function(req, res){
	req.logout();

	req.flash('success_msg', 'Se ha cerrado la sesión');

	res.redirect('/users/login');
});


function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0,0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    // Return array of year and week number
    return weekNo;
}

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