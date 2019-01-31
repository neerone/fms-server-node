const attributeTypes = {
	text: 3,
	bool: 4,
	integer: 5,
	float: 6,
	mm: 7,
	meters: 8,
	cm: 9,
	capacity: 10,
	megawatts: 11,
	watts: 12,
	killowatts: 19,
	walts: 19,
	gramms: 13,
	killogramms: 14,
	pins: 15,
	noize: 16,
	hour: 17,
	day: 18,
	month: 2,
	year: 1,

	angle:21
}

/* PRIMITIVES*/

function CheckDecimal(inputtxt)   
{   
	var check=  /^[-+]?[0-9]+\.[0-9]+$/;   
	return inputtxt.match(check);  
} 
function CheckInteger(n) {
    return n >>> 0 === parseFloat(n);
}

function CheckBool(lowerCasedValue) {
	if (lowerCasedValue == "да" || 
		lowerCasedValue == "нет" || 
		lowerCasedValue == "yes" || 
		lowerCasedValue == "no" || 
		lowerCasedValue == "true" || 
		lowerCasedValue == "false"
	) 
	{
		return true;
	}
	return false;
}


/* DATES */
function CheckYears(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:лет|год|Year|Years)/g;
	return inputtxt.match(regex);  
}

function CheckMonths(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:месяцев|months)/g;
	return inputtxt.match(regex);  
}

function CheckDays(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:дней|день|days|d)/g;
	return inputtxt.match(regex);  
}

function CheckHours(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:h|hour|hours|час|часов|ч)/g;
	return inputtxt.match(regex);  
}

/* NOIZE */
function CheckNoize(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:db|dba|дб)/g;
	return inputtxt.match(regex);  
}
/* PINS */
function CheckPins(inputtxt)   
{   
	const regex = /(\d+)(?:\s|)(?:pin|пин|пинов)/g;
	return inputtxt.match(regex);  
}
/* WEIGTHS */

function CheckKillograms(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:кг|kg|killograms|килограммы)/g;
	return inputtxt.match(regex);  
}
function CheckGramms(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:г|g|gg|грамм|gramm)/g;
	return inputtxt.match(regex);  
}

/* ELECTO */
function CheckWalts(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:в|вольт|w)/g;
	return inputtxt.match(regex);  
}
function CheckWatts(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:wattage|вт|watt)/g;
	return inputtxt.match(regex);  
}
function CheckMegaWatts(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:mw|мвт)/g;
	return inputtxt.match(regex);  
}
function CheckKiloWatts(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:kw|кв)/g;
	return inputtxt.match(regex);  
}


function CheckCapacity(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:mah|мач)/g;
	return inputtxt.match(regex);  
}

/*Angle*/
function CheckAngle(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:°|deg|угол)/g;
	return inputtxt.match(regex);  
}

/* LENGTHS */

function CheckCentimeters(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:cm|см|сантиметров)/g;
	return inputtxt.match(regex);  
}

function CheckMeters(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:метров|meters|meter)/g;
	return inputtxt.match(regex);  
}

function CheckMillimeters(inputtxt)   
{   
	const regex = /(\d+\.\d+|\d+)(?:\s|)(?:m|mm|мм|миллиметр|миллиметров)/g;
	return inputtxt.match(regex);  
}


function getAttributeType(attributeValue) {	
	let lowerCasedValue = attributeValue.trim().toLowerCase();

	if (CheckYears(lowerCasedValue)) return    attributeTypes.year
	if (CheckMonths(lowerCasedValue)) return   attributeTypes.month 
	if (CheckDays(lowerCasedValue)) return   attributeTypes.day 
	if (CheckHours(lowerCasedValue)) return    attributeTypes.hour
	if (CheckNoize(lowerCasedValue)) return  attributeTypes.noize  
	if (CheckPins(lowerCasedValue)) return  attributeTypes.pins  
	if (CheckKillograms(lowerCasedValue)) return  attributeTypes.killogramms  
	if (CheckGramms(lowerCasedValue)) return  attributeTypes.gramms  

	/*WATTAGE AND ELECTOCITY*/
	if (CheckWalts(lowerCasedValue)) return  attributeTypes.walts  
	if (CheckWatts(lowerCasedValue)) return  attributeTypes.watts  
	if (CheckKiloWatts(lowerCasedValue)) return  attributeTypes.killowatts  
	if (CheckMegaWatts(lowerCasedValue)) return  attributeTypes.megawatts   
	if (CheckCapacity(lowerCasedValue)) return   attributeTypes.capacity 


	if (CheckCentimeters(lowerCasedValue)) return attributeTypes.cm   
	if (CheckMeters(lowerCasedValue)) return attributeTypes.meters   
	if (CheckMillimeters(lowerCasedValue)) return  attributeTypes.mm  
	if (CheckDecimal(lowerCasedValue)) return attributeTypes.float
	if (CheckInteger(lowerCasedValue)) return attributeTypes.integer

	if (CheckAngle(lowerCasedValue)) return attributeTypes.angle

	if (CheckBool(lowerCasedValue)) return attributeTypes.bool

	return attributeTypes.text;
}



module.exports = {
	getAttributeType:getAttributeType
}