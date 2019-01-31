STORAGE = require('../../storage');
var MI = require('../../constants/MI')
var WT = require('../../constants/widgetTypes');
var RT = require('../../constants/relationTypes');
var g = require('../../utils/getters');
var _ = require('lodash');
var {normalizeResults,normalizeDates,createDatabaseQuery} = require('./SelectorUtils')
const CMD = require('../../constants/commands');

const initialSelector = {"filter":{},"sort":{"field":"id","dir":"desc","dataType":"string"},"pagination":[0,15],"groups":{},"aggregates":{}};

var {c, knex} = require('../Connection');


function getWidgetRelation(widget) {
	let relation = null;
	if (!widget) return relation;
	let directRelationId = _.get(widget, "relation_id");
	if (directRelationId) {
		return g.getMetaModelsRelations(directRelationId);
	}
	return null;
}
function getWidgetAttribute(widget) {
	let attr = null;
	if (!widget) return attr;
	let attrId = _.get(widget, "attr_id");
	if (attrId) {
		return g.getMetaModelsAttributes(attrId);
	}
	return null;
}
function getElementState(modelId,elementId) {
	return _.find(g.getStates(), (state) => {
		return state.obj_id == elementId && state.obj_type == modelId
	});
}
function generateSelectorByRelations({relation_type,relation_key,model_id,relation_model_id}, oldSelector, modelHistory) {

	var lastModelHistoryElement = _.last(modelHistory);
	if (!lastModelHistoryElement) return oldSelector;



	var [parentModelId, parentElementId, parentItem] = lastModelHistoryElement;



	var  newFilt = {};


	switch (relation_type) {
		case RT.MORPH_MANY:
		case RT.MORPH_ONE:
			newFilt = {
				logic: "and",
				filters: {
			        [_.uniqueId("filt")+"_id"] : {
						field : relation_key + "_id", 
			            operator : "eq", 
			            value : parentElementId
			        },
					[_.uniqueId("filt")+"_type"] : { 
						field : relation_key + "_type", 
			            operator : "eq", 
			            value : parentModelId
			        }
				}
			}
		break;
		case RT.HAS_ONE: 
		case RT.BELONGS_TO: 

			if (parentItem) {
				newFilt = {
					logic: "and",
					filters: {
						[_.uniqueId("filt")+"_"+relation_key] : { 
							field : "id", 
				            operator : "eq", 
				            value : parentItem[relation_key]
				        }
					}
				}
			} 

		break;
		case RT.HAS_MANY:
			newFilt = {
				logic: "and",
				filters: {
					[_.uniqueId("filt")+"_id"] : { 
						field :relation_key, 
			            operator : "eq", 
			            value : parentElementId
			        }
				}
			}
		break;
	}


	
	let newSelector = _.clone(oldSelector);
	newSelector.filter = newFilt;

	return newSelector
}

function convertOperatorToSign(op, val) {
	switch (op) {
		case "contains":
		return 'LIKE';
		break;
		case "eq":
		return "=";
		break;
		case "neq":
		return "!=";
		break;
		case "gt":
		return ">";
		break;
		case "gte":
		return ">=";
		break;
		case "lt":
		return "<";
		break;
		case "lte":
		return "<=";
		break;
	}
}


function nestedFieldQuery(modelId, fieldPath, op, val) {
	let tableName = `t_${modelId}`;
	let query = knex(tableName).select("id");



	var currentField = fieldPath[0]
	if (fieldPath.length> 1) {

		let attribute = _.find(g.getMetaModelsAttributes(), {model_id:modelId, field_name: currentField});
		if (!attribute) return false;
		let relation  = _.find(g.getMetaModelsRelations(), {id:attribute.relation_id});
		if (!relation) return false;

		let {relation_model_id, relation_key} = relation;
		let nextTableName = `t_${relation_model_id}`;

		let newFieldPath = _.clone(fieldPath);
		newFieldPath.splice(0, 1);
		query.whereIn(relation_key, nestedFieldQuery(relation_model_id, newFieldPath, op, val));

	} else {
		query.where(currentField, op, val)
	}

	return query;
}


function createQueryFromSelector(modelId, selector, count) {

	let tableName = `t_${modelId}`;

	let query = knex(tableName);


	if (count) {
		query.count('id as c')
	}
	let createWhereFromFilters = function(mid, filter, q) {
		let {filters, logic} = filter;
		let whereFuncName = (logic == "and") ? 'andWhere' : 'orWhere';
		let conditionQueryParts = _.map(filters, (f, filterKey) => {
			if (filterKey.includes("grp")) {
				let subquery = knex(tableName).select('id');
				createWhereFromFilters(mid, f, subquery);
				q.whereIn('id', subquery);
			} else {
				let fieldPath = f.field.split(".");

				let val = (f.operator == "contains") ? `%${f.value}%` : f.value;
				if (fieldPath.length>1){
					let subquery = nestedFieldQuery(mid, fieldPath, convertOperatorToSign(f.operator), val );
					q.whereIn('id', subquery);
				} else {

					if (f.field && val) {
						validWhere = true;


						q[whereFuncName](f.field, convertOperatorToSign(f.operator), val);

					} 
				}
			}
		})

	}


	if (selector.filter.filters) {
		createWhereFromFilters(modelId, selector.filter, query);
	}
	if (!count) {
		if (selector.sort) {
			query.orderBy(selector.sort.field, selector.sort.dir)
		}

		if (selector.pagination) {
			let [page, itemsOnThePage] = selector.pagination;
			let offset = page * itemsOnThePage;
			query.offset(offset).limit(itemsOnThePage)
		}
		
	}

	return query.toString();
}




function getDeepNestedWidgetsIds(widgetId) {
	var scannedWidgets = [];
	function scanDeepRelatedWidgets(wid) {
		var relatedWidgets = _.map(_.filter(g.getMetaWidgets(),(r) => {return r.parent_widget_id == wid}), (w) =>w.id+"");
		if (relatedWidgets.length == 0) return [];
		return _.reduce(relatedWidgets, (acc, rwid) => {
			if (scannedWidgets.includes(rwid)) return acc;
			scannedWidgets.push(rwid);
			return _.concat(acc, scanDeepRelatedWidgets(rwid), [rwid, widgetId]);
		}, [])
	}
	return _.uniq(scanDeepRelatedWidgets(widgetId));
}


function getDeepNestedWidgets(widgetId) {
	let widgetIds =  getDeepNestedWidgetsIds(widgetId);
	let widgets = _.map(widgetIds, (id) => g.getMetaWidgets(id));
	return normalizeResults({"5":widgets})
}




function getDataByRelation(rel, selector, modelHistory, currentWidgetKey, processedQueries) {
	let newSelector = generateSelectorByRelations (rel, selector, modelHistory);


	let modelId = rel.relation_model_id;
	let result ={};
	let query = createQueryFromSelector(modelId, newSelector);
	let countQuery = createQueryFromSelector(modelId, newSelector, true);

	if (processedQueries.includes(query)) {
		return new Promise((s,f) => s({}));
	} else {
		processedQueries.push(query);
		return createDatabaseQuery(query).then(d=> {

			return createDatabaseQuery(countQuery).then(res=> {
				result[modelId] = d;		
				return {
					storage: normalizeResults(result),
					widgetStates: {
						[currentWidgetKey] : {
							display: _.map(d, a => g.getId(a) +""),
							counts: res[0].c
						}
					}
				};
			});
		}, err=> {
			return {};
		});
	}


	//return getSelectedData(rel.relation_model_id, newSelector, processedQueries)
}

function makeHash() {
	return _.reduce(arguments, (acc, arg) => {return acc + JSON.stringify(arg);}, "")
}

function getFullStackWidget(widget, output) {
	if (!_.isObject(widget)) widget = g.getMetaWidgets(widget);
	let wid = g.getId(widget);

	if (!output) output = {storage: {}};
	if (!output.storage[MI.META_WIDGETS]) output.storage[MI.META_WIDGETS] = {};
	if (!output.storage[MI.META_MODELS_ATTRIBUTES]) output.storage[MI.META_MODELS_ATTRIBUTES] = {};
	if (!output.storage[MI.META_MODELS_RELATIONS]) output.storage[MI.META_MODELS_RELATIONS] = {};


	output.storage[MI.META_WIDGETS][wid] = widget;


	let widgetAttr = getWidgetAttribute(widget);
	if (widgetAttr)	{
		output.storage[MI.META_MODELS_ATTRIBUTES][g.getId(widgetAttr)] = widgetAttr;
	}
	
	let widgetRel = getWidgetRelation(widget);
	if (widgetRel)	{
		output.storage[MI.META_MODELS_RELATIONS][g.getId(widgetRel)] = widgetRel;
	}

	let options = g.getObjectOptions([MI.META_WIDGETS], wid);
	if (options.length > 0 ) {
		output = _.merge(output, {storage: normalizeResults({[MI.META_OPTIONS] : options})});
	}

	return output;
}

function processAllStates(final) {


	let storage = _.clone(final.storage);
	let states = {
		storage: {
			[MI.META_STATES] : {}
		}
	}
	_.each(storage, (collection, modelId) => {
		_.each(collection, (element, elementId) => {
			var elementState = getElementState(modelId,elementId);
			if (elementState) {
				var elementStateId = g.getId(elementState);
				states.storage[MI.META_STATES][elementStateId] = elementState;
			}
		})

	});
	return _.merge(final, states);
}

function getWidgetDataWrapper({modelId, widgetId, mainSelector, elementId}, modelHistory, rootWidgetKey) {

	let processedUnits = [];
	let processedQueries = [];

	var mainWidget = g.getMetaWidgets(widgetId);
	var mainRelation = (mainWidget) ? getWidgetRelation(mainWidget) : null;
	var mainRelationModel = (mainRelation) ? mainRelation.relation_model_id : null;



	let getWidgetData = function({mainRelationModel, widgetId}, modelHistory, currentWidgetKey) {

		let finalOut = {};
		return new Promise((resolve, reject) => {

			var currentWidget = g.getMetaWidgets(widgetId);

			var output = {
				storage: {

					[MI.META_WIDGETS] : {
						[widgetId] : currentWidget
					}
				},
				widgetStates: {}
			}

			var relation = getWidgetRelation(currentWidget);


			/*Взяли виджеты*/
			var widgetChilds = _.filter(g.getMetaWidgets(), (w) => {
				return (w.parent_widget_id == widgetId);
			})


			output = getFullStackWidget(currentWidget, output);
			

			if (relation) {
				//return resolve(output)
				output.storage[MI.META_MODELS_RELATIONS] = {
					[g.getId(relation)] : relation
				}

				if ((elementId+"").includes("new")) {
					//Элемент новый, смысла смотреть связи поэлементно нет. Выявляем все виджеты для отображения и впередд


					_.each(getDeepNestedWidgets(widgetId)[MI.META_WIDGETS], (widget) => {
						output = getFullStackWidget(widget, output);
					})

					return resolve(processAllStates(output));
				} else {
					selector = _.clone(initialSelector);

					if (relation.relation_model_id+"" == mainRelationModel+"") {
						selector = mainSelector;
					}


					getDataByRelation(relation, selector, modelHistory, currentWidgetKey, processedQueries).then(r => {


						if (!widgetChilds || widgetChilds.length == 0) {
							return resolve(processAllStates(_.merge(output, r)));
						} else {

							let childsToMerge = {
								storage: normalizeResults({[MI.META_WIDGETS] : widgetChilds})
							}
							var promises = [];
							_.each(r.storage, (collection, mid) => {

								

								_.each(collection, (item, itemId)=> {
									let modelHistoryClone = _.cloneDeep(modelHistory);

									modelHistoryClone.push([mid, itemId, item]);
									_.each(widgetChilds, (childWidget) => {
										var childWidgetId = g.getId(childWidget)
										var h = makeHash(childWidgetId, modelHistoryClone);
										if (!processedUnits.includes(h)) {
											processedUnits.push(h);
											childWidgetKey  = currentWidgetKey + "-" + childWidgetId;
											promises.push(getWidgetData({widgetId:childWidgetId}, modelHistoryClone, childWidgetKey))
										}
									})
								})
							})
							Promise.all(promises).then( (childResults) => {
								let childOutput = _.reduce(childResults, (acc, childResult) => {
									return _.merge(acc, childResult);
								}, {});

								return resolve(processAllStates(_.merge(output, r, childOutput, childsToMerge)));
							});
						}
					});
				}





			} else {

				//У виджета НЕТУ связи  но возможно он обычный виджет-контейн типа вкладок.
				if (!widgetChilds || widgetChilds.length == 0) {
					//У этого виджета нету так же и детей. Просто возвращаем результат
					return resolve(processAllStates(output));
				} else {
					//Дети есть, прокидываем модель хистори дальше 
					var promises = [];
					_.each(widgetChilds, (childWidget) => {
						var childWidgetId = g.getId(childWidget);
						var h = makeHash(childWidgetId, modelHistory);
						if (!processedUnits.includes(h)) {
							processedUnits.push(h);
							childWidgetKey  = currentWidgetKey + "-" + childWidgetId;
							promises.push(getWidgetData ({widgetId:childWidgetId}, modelHistory, childWidgetKey))
						}
					});


					Promise.all(promises).then( (childResults) => {
						let childOutput = _.reduce(childResults, (acc, childResult) => {
							return _.merge(acc, childResult);
						}, {});
						return resolve(processAllStates(_.merge(output, childOutput)));
					});
				}

			}



		
		});

	}
	return getWidgetData({mainRelationModel:mainRelationModel, widgetId}, modelHistory, rootWidgetKey);

}

function widgetDataRequest(req,ws, cb) {
	var requests = req.data;
	var rootWidgetKey = req.widgetKey;
	var promises = [];

	_.each(requests, ({modelId, elementId, widgetId, selector}) => {
		let modelHistory = [];
		if (elementId && elementId != 0) {
			modelHistory.push([modelId, elementId, {id:elementId}]);
		}
		promises.push(getWidgetDataWrapper({modelId, elementId, widgetId, mainSelector:selector}, modelHistory, rootWidgetKey));
	})

	Promise.all(promises).then( (reqResults) => {
		req.command = CMD.CMDS.LOAD_WIDGET_SUCCESS;
		req.data = _.reduce(reqResults, (acc, res) => {
			return _.merge(acc, res);
		}, {});

		cb(req);
	}, (failure) => {
		req.command = CMD.CMDS.LOAD_WIDGET_FAILURE;
		req.status = "Err";
		req.message = "Произошла ошибка : " + failure;
		cb(req);
	});
}





exports = module.exports = {
	widgetDataRequest: widgetDataRequest
};