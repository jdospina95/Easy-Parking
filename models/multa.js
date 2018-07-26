var mongoose = require('mongoose');

var MultasSchema = mongoose.Schema({
    placas: {
        type: String,
		index: true
    },
	dia: {
		type: Number
	},
	mes: {
		type: Number
	},
	year: {
		type: Number
	},
	infraccion: {
		type: String
	},
	lugar: {
		type: String
	},
	imagen: {
	    data: Buffer, 
	    contentType: String
	}
});

var Multas = module.exports = mongoose.model('Multas', MultasSchema);

module.exports.ingresarMulta = function(multa, callback){
	multa.save(callback);
}

module.exports.getMultaByPlates = function(plates, callback){
	var query = {placas: plates};
	Multas.findOne(query, callback);
}