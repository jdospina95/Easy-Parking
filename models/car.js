var mongoose = require('mongoose');

var CarSchema = mongoose.Schema({
	placas: {
		type: String,
		index: true
	},
	fecha: {
		type: Number
	},
	lugar: {
		type: String
	},
	hora: {
		type: String
	}
});

var Car = module.exports = mongoose.model('Car', CarSchema);

module.exports.ingresarCarro = function(carro, callback){
    carro.save(callback);
}

module.exports.getCarByPlates = function(plates, callback){
	var query = {placas: plates};
	Car.findOne(query, callback);
}

module.exports.getCount = function(lugar, callback){
	var query = {lugar: lugar};
	Car.count(query, callback);
}

module.exports.retornarCarro = function(placas, callback){
	var query = {placas: placas}
	Car.findOne(query, callback)
}
