define( [ "qlik", "./initialProperties", "./definition", "./paint","./d3.min" ,"css!./UHMB-SPC_RareEvents.css"], function (qlik, jsInitialProperties, jsDefinition, jsPaint,d3) {
	return {
		initialProperties: jsInitialProperties,
		definition: jsDefinition,
		support : {
			snapshot: true,
			export: true,
			exportData : false
		},
		paint: jsPaint
	
	};
});