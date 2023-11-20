define([ './d3.min'], function (d3) {
	return {
		type: "items",
		component: "accordion",
		items: {
			dimensions: {
				uses: "dimensions",
				min: 2,
				max: 2
			},
			measures: {
				uses: "measures",
				min: 1,
				max: 2
			},
			settings: {
				uses: "settings"
			},
			sorting: {
				uses: "sorting"
			},
			addons: {
				uses: "addons",
				items: {
					dataHandling: {
						uses: "dataHandling"
					}
				}
			},
			CustomProperties: {
				component: "expandable-items",
				label: "SPC Properties",
				items: {
					Options: {
						type: "items",
						label: "Options",
						items: {
							ChartType: {
								type: "string",
								label: "Chart Type",
								ref: "ChartType",
								component: "buttongroup",
								options: [{
									value: "g",
									label: "G Chart"
									},{
									value: "t",
									label: "T Chart"
									}
								],
								defaultValue: "t"



							},
							TChartUnits:{
								ref: "TChartUnits",
								type: "string",
								label: "T Chart Units",
								component: "buttongroup",
								options: [{
									value: "day",
									label: "Days"
									},
									{
									value: "hour",
									label: "Hours"
									},
									{
									value: "minute",
									label: "Minutes"
									}
								],
								defaultValue: "day"

							},
							BaselineFlag: {
								type: "boolean",
								label: "Use Baseline",
								ref: "BaseLineFlag",
								defaultValue: false
							},
							CalculationPoints: {
								ref: "CalcPoints",
								type: "string",
								label: "Num Points for Baseline",
								expression: "optional",
								defaultValue: "200",
								show: function (data) {
									return data.BaseLineFlag;
								}

							}
						}
					}
					,Formatting:{
						type: "items",
						label: "Formatting",
						items:{
							MinXAxisStep: {
								ref: "XAxisStep",
								type: "integer",
								label: "Date tick seperation",
								expression: "optional",
								defaultValue: 30
							},
							ShowLabels: {
								ref: "showLabels",
								type: "boolean",
								label: "Show Labels",
								expression: "optional",
								defaultValue: true
							},
							HideXAxis: {
								ref: "HideXAxis",
								type: "integer",
								label: "Hide X Axis (0 or 1)",
								expression: "optional",
								defaultValue: 0
							},
							// DateFormat: {
							// 	ref: "dateFormat",
							// 	type: "string",
							// 	label: "Format for X axis",
							// 	expression: "optional",
							// 	defaultValue: "%d-%b-%Y"
							// },
							ShowRecal: {
								ref: "showRecalc",
								type: "integer",
								label: "Show recalculation periods (0 or 1)?",
								expression: "optional",
								defaultValue: "0"
							},
							RecalColours: {
								ref: "recalColours",
								type: "string",
								label: "Colour array for recalc periods e.g #00FFFF;red;violet",
								expression: "optional",
								defaultValue: ""
							},
							TableWidth: {
								ref: "tableWidth",
								type: "integer",
								label: "Width of Definition table ( 0 to disable)",
								expression: "optional",
								defaultValue: 150
							},
							ShowDQIcons: {
								ref: "ShowDQ",
								type: "integer",
								label: "Enable DQ Icon (1=Yes)",
								expression: "optional",
								defaultValue: 0
							},
							SignOff: {
								ref: "DQSignOff",
								type: "integer",
								label: "Sign Off Value",
								expression: "optional",
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							},
							Review: {
								ref: "DQReview",
								type: "integer",
								label: "Review Value",
								expression: "optional",
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							},
							Timely: {
								ref: "DQTimely",
								type: "integer",
								label: "Timely Value",
								expression: "optional",
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							},
							Complete: {
								ref: "DQComplete",
								type: "integer",
								label: "Complete Value",
								expression: "optional",
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							},
							Process: {
								ref: "DQProcess",
								type: "integer",
								label: "Process Value",
								expression: "optional",
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							},
							System: {
								ref: "DQSystem",
								type: "integer",
								label: "System Value",
								expression: "optional",
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							},
							DQIconSize: {
								ref: "DQIconSize",
								type: "integer",
								label: "DQ Icon Size (px)",
								expression: "optional",
								defaultValue: 15,
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							},
							DQTextSize: {
								ref: "DQTextSize",
								type: "string",
								label: "DQ Text Size",
								expression: "optional",
								defaultValue: "1.2em",
								show: function (data) {
									var x = false;
									if (data.ShowDQ == 1) {
										x = true;
									}
									return x;
								}
							}
						}
					}

				}
			},
			abouttxt: {
				label: "About",
				type: "items",
				items: {
					abouttxt2: {
						label: "About",
						type: "items",
						items: {
							aboutt: {
								component: "text",
								label: "UHMB ScoreCard t/G Chart Extension developed by Dale Wright"
							},
							about2: {
								component: "text",
								label: "Dimension Order: EventID > Event Date"
							},
							about3: {
								component: "text",
								label: "Measures: Number of Events since last signal (If doing a T chart this will be ignored) > RecalculationID (optional)"
							},
							about4: {
								component: "link",
								label: "GitHub for Extension",
								url: "https://github.com/DizzleWizzle/UHMB_SPC_RareEvents"
							}
						}
					}
				}
			}
		}
	};
});
