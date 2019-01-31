var MI = require('../constants/MI');
STORAGE = require('../storage');
var _ = require("lodash");

function getId(object) { return _.get(object, "id"); } 

function getLabel(object) { return _.get(object, "id"); } 

function getMeta (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META, objId] )
	}
	return _.get(STORAGE, MI.META);
} 

function getMetaModels (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_MODELS, objId] )
	}
	return _.get(STORAGE, MI.META_MODELS);
} 

function getMetaModelsAttributes (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_MODELS_ATTRIBUTES, objId] )
	}
	return _.get(STORAGE, MI.META_MODELS_ATTRIBUTES);
} 

function getMetaWidgets (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_WIDGETS, objId] )
	}
	return _.get(STORAGE, MI.META_WIDGETS);
} 

function getMetaOptions (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_OPTIONS, objId] )
	}
	return _.get(STORAGE, MI.META_OPTIONS);
} 

function getMetaModelsRelations (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_MODELS_RELATIONS, objId] )
	}
	return _.get(STORAGE, MI.META_MODELS_RELATIONS);
} 

function getDocs (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.DOCS, objId] )
	}
	return _.get(STORAGE, MI.DOCS);
} 

function getDocsSales (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.DOCS_SALES, objId] )
	}
	return _.get(STORAGE, MI.DOCS_SALES);
} 

function getDocsSalesLines (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.DOCS_SALES_LINES, objId] )
	}
	return _.get(STORAGE, MI.DOCS_SALES_LINES);
} 

function getMetaLogicCalcs (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_LOGIC_CALCS, objId] )
	}
	return _.get(STORAGE, MI.META_LOGIC_CALCS);
} 

function getMetaLogicValidations (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_LOGIC_VALIDATIONS, objId] )
	}
	return _.get(STORAGE, MI.META_LOGIC_VALIDATIONS);
} 

function getUser (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.USER, objId] )
	}
	return _.get(STORAGE, MI.USER);
} 

function getStates () { 
	return _.get(STORAGE, MI.META_STATES);
} 

function getRefs (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS, objId] )
	}
	return _.get(STORAGE, MI.REFS);
} 

function getRegs (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REGS, objId] )
	}
	return _.get(STORAGE, MI.REGS);
} 

function getRegsStock (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REGS_STOCK, objId] )
	}
	return _.get(STORAGE, MI.REGS_STOCK);
} 

function getReports (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REPORTS, objId] )
	}
	return _.get(STORAGE, MI.REPORTS);
} 

function getReportsStock (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REPORTS_STOCK, objId] )
	}
	return _.get(STORAGE, MI.REPORTS_STOCK);
} 

function getFiles (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.FILES, objId] )
	}
	return _.get(STORAGE, MI.FILES);
} 

function getEnvs (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.ENVS, objId] )
	}
	return _.get(STORAGE, MI.ENVS);
} 

function getMetaWidgetTypes (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_WIDGET_TYPES, objId] )
	}
	return _.get(STORAGE, MI.META_WIDGET_TYPES);
} 

function getMetaWidgetPurposes (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_WIDGET_PURPOSES, objId] )
	}
	return _.get(STORAGE, MI.META_WIDGET_PURPOSES);
} 

function getRefsClients (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_CLIENTS, objId] )
	}
	return _.get(STORAGE, MI.REFS_CLIENTS);
} 

function getDocsPurchases (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.DOCS_PURCHASES, objId] )
	}
	return _.get(STORAGE, MI.DOCS_PURCHASES);
} 

function getDocsPurchasesLines (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.DOCS_PURCHASES_LINES, objId] )
	}
	return _.get(STORAGE, MI.DOCS_PURCHASES_LINES);
} 

function getRefsFirms (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_FIRMS, objId] )
	}
	return _.get(STORAGE, MI.REFS_FIRMS);
} 

function getRefsFloweries (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_FLOWERIES, objId] )
	}
	return _.get(STORAGE, MI.REFS_FLOWERIES);
} 

function getRefsEmployees (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_EMPLOYEES, objId] )
	}
	return _.get(STORAGE, MI.REFS_EMPLOYEES);
} 

function getRefsNomenclature (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_NOMENCLATURE, objId] )
	}
	return _.get(STORAGE, MI.REFS_NOMENCLATURE);
} 

function getRefsOccupations (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_OCCUPATIONS, objId] )
	}
	return _.get(STORAGE, MI.REFS_OCCUPATIONS);
} 

function getRefsNomenclatureTypes (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_NOMENCLATURE_TYPES, objId] )
	}
	return _.get(STORAGE, MI.REFS_NOMENCLATURE_TYPES);
} 

function getUsers (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.USERS, objId] )
	}
	return _.get(STORAGE, MI.USERS);
} 

function getUsersTabs (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.USERS_TABS, objId] )
	}
	return _.get(STORAGE, MI.USERS_TABS);
} 

function getDocsUnits (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.DOCS_UNITS, objId] )
	}
	return _.get(STORAGE, MI.DOCS_UNITS);
} 

function getDocsOrders (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.DOCS_ORDERS, objId] )
	}
	return _.get(STORAGE, MI.DOCS_ORDERS);
} 

function getRefsPaymentTypes (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_PAYMENT_TYPES, objId] )
	}
	return _.get(STORAGE, MI.REFS_PAYMENT_TYPES);
} 

function getRefsClientsCards (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_CLIENTS_CARDS, objId] )
	}
	return _.get(STORAGE, MI.REFS_CLIENTS_CARDS);
} 

function getRefsCashes (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_CASHES, objId] )
	}
	return _.get(STORAGE, MI.REFS_CASHES);
} 

function getRefsNomenclatureGroups (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.REFS_NOMENCLATURE_GROUPS, objId] )
	}
	return _.get(STORAGE, MI.REFS_NOMENCLATURE_GROUPS);
} 

function getMetaActions (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_ACTIONS, objId] )
	}
	return _.get(STORAGE, MI.META_ACTIONS);
} 

function getMetaToolbars (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_TOOLBARS, objId] )
	}
	return _.get(STORAGE, MI.META_TOOLBARS);
} 

function getMetaToolbarButtons (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_TOOLBAR_BUTTONS, objId] )
	}
	return _.get(STORAGE, MI.META_TOOLBAR_BUTTONS);
} 

function getMetaToolbarButtonsActions (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_TOOLBAR_BUTTONS_ACTIONS, objId] )
	}
	return _.get(STORAGE, MI.META_TOOLBAR_BUTTONS_ACTIONS);
} 

function getMetaToolbarToolbarButtons (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_TOOLBAR_TOOLBAR_BUTTONS, objId] )
	}
	return _.get(STORAGE, MI.META_TOOLBAR_TOOLBAR_BUTTONS);
} 

function getMetaToolbarButtonAction (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_TOOLBAR_BUTTON_ACTION, objId] )
	}
	return _.get(STORAGE, MI.META_TOOLBAR_BUTTON_ACTION);
} 

function getMetaWidgetsLogic (objId) { 
	if (objId) {
		return _.get(STORAGE, [MI.META_WIDGETS_LOGIC, objId] )
	}
	return _.get(STORAGE, MI.META_WIDGETS_LOGIC);
} 


function getElement (modelId, objId) {
	return _.get(STORAGE, [modelId, objId] )
}

function getObjectOptions(modelId, objId) {
	return _.filter(STORAGE[MI.META_OPTIONS], (o)=>{
		return (o.obj_type == modelId && o.obj_id == objId);
	})
}



module.exports = {
	getObjectOptions,
	getElement,
	getId,
	getMeta,
	getMetaModels,
	getMetaModelsAttributes,
	getMetaWidgets,
	getMetaOptions,
	getMetaModelsRelations,
	getDocs,
	getDocsSales,
	getDocsSalesLines,
	getMetaLogicCalcs,
	getMetaLogicValidations,
	getUser,
	getStates,
	getRefs,
	getRegs,
	getRegsStock,
	getReports,
	getReportsStock,
	getFiles,
	getEnvs,
	getMetaWidgetTypes,
	getMetaWidgetPurposes,
	getRefsClients,
	getDocsPurchases,
	getDocsPurchasesLines,
	getRefsFirms,
	getRefsFloweries,
	getRefsEmployees,
	getRefsNomenclature,
	getRefsOccupations,
	getRefsNomenclatureTypes,
	getUsers,
	getUsersTabs,
	getDocsUnits,
	getDocsOrders,
	getRefsPaymentTypes,
	getRefsClientsCards,
	getRefsCashes,
	getRefsNomenclatureGroups,
	getMetaActions,
	getMetaToolbars,
	getMetaToolbarButtons,
	getMetaToolbarButtonsActions,
	getMetaToolbarToolbarButtons,
	getMetaToolbarButtonAction,
	getMetaWidgetsLogic,
}