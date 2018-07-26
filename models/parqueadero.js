var mongoose = require('mongoose');

var ParqueaderosSchema = mongoose.Schema({
	dia: {
		type: Number
	},
	semana: {
		type: Number
	},
	mes: {
		type: Number
	},
	ocupados: {
		type: Number
	},
	lugar: {
		type: String,
		index: true
	}
});

var Parqueaderos = module.exports = mongoose.model('Parqueaderos', ParqueaderosSchema);

module.exports.ingresarParqueadero = function(parqueadero, callback){
	parqueadero.save(callback);
}

module.exports.getParqueadero = function(dia, mes, semana, lugar, callback){
	var query = {dia:dia, mes:mes, semana:semana, lugar:lugar};
	Parqueaderos.findOne(query, callback);
}