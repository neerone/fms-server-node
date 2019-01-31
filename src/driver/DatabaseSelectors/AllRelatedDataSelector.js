STORAGE = require('../../storage');
var MI = require('../../constants/MI')
var WT = require('../../constants/widgetTypes');
var RT = require('../../constants/relationTypes');
var g = require('../../utils/getters');
var _ = require('lodash');
var {normalizeResults,normalizeDates,createDatabaseQuery} = require('./SelectorUtils')
const CMD = require('../../constants/commands');



/*


findDirectChildCollection : String -> String -> Int -> DataStorage -> DataStorage
findDirectChildCollection modelId elementId uniqueId storage =
    let
        model =
            getModelById (getModels storage) modelId

        modelRelations =
            storage
                |> getRelations
                |> Dict.filter
                    (\k v ->
                        (fromDict "model_id" "0" v) == modelId
                    )
                |> Dict.toList
                |> List.map
                    (\( _, relation ) ->
                        let
                            rt =
                                fromDict "relation_type" "" relation

                            rk =
                                fromDict "relation_key" "" relation

                            relationModelId =
                                fromDict "relation_model_id" "" relation
                        in
                            if (rt == relationtype.has_many || rt == relationtype.morph_many) then
                                let
                                    collectionSelector =
                                        relatedCollectionSelector (toString uniqueId) rt rk elementId modelId initialSelector

                                    collection =
                                        getItems relationModelId storage
                                            |> selectItems collectionSelector
                                            |> Tuple.first
                                            |> List.map (\v -> ( getId v, v ))
                                            |> Dict.fromList
                                in
                                    ( relationModelId, collection )
                            else
                                let
                                    element =
                                        storage
                                            |> fromDict modelId Dict.empty
                                            |> fromDict elementId Dict.empty

                                    rk =
                                        fromDict "relation_key" "" relation

                                    rt =
                                        fromDict "relation_type" "" relation

                                    relationModelId =
                                        fromDict "relation_model_id" "" relation

                                    elementRelatedKeyValue =
                                        fromDict rk "" element

                                    collection =
                                        if (rt == relationtype.has_one || rt == relationtype.belongs_to) then
                                            let
                                                relatedElement =
                                                    storage
                                                        |> fromDict relationModelId Dict.empty
                                                        |> findFromDict (\k v -> elementRelatedKeyValue == k)
                                            in
                                                case relatedElement of
                                                    Just ( i, e ) ->
                                                        Dict.fromList [ ( i, e ) ]

                                                    Nothing ->
                                                        Dict.fromList []
                                        else
                                            Dict.fromList []
                                in
                                    ( relationModelId, collection )
                    )
                |> List.filter (\( _, items ) -> not (Dict.isEmpty items))
                |> Dict.fromList
    in
        modelRelations


findFlatNestedChilds : String -> String -> Int -> DataStorage -> DataStorage -> DataStorage
findFlatNestedChilds modelId elementId uniqueId stored storage =
    let
        allChildsBeforeSubstractions =
            findDirectChildCollection modelId elementId uniqueId storage

        allChilds =
            allChildsBeforeSubstractions
                |> (flip substractStorage) stored

        newStored =
            if (Dict.isEmpty allChilds) then
                stored
            else
                allChildsBeforeSubstractions
                    |> mergeDataStorage stored
    in
        allChilds
            |> Dict.foldl
                (\relatedModelId itemCollection result ->
                    itemCollection
                        |> Dict.foldl
                            (\itemId element res ->
                                storage
                                    |> findFlatNestedChilds relatedModelId itemId uniqueId newStored
                                    |> mergeDataStorage res
                            )
                            Dict.empty
                        |> (flip mergeDataStorage) result
                )
                Dict.empty
            |> mergeDataStorage allChilds


*/




function relatedCollectionSelector(oldSelector, rt, rk, parentElementId, parentModelId) {
    if (rt == RT.MORPH_MANY || rt == RT.MORPH_ONE) {
        return {
            filter: {
                [_.uniqueId("filt")+"_type"]: {
                    field : rk + "_type", 
                    operator : "eq", 
                    value :parentModelId, 
                },
                [_.uniqueId("filt")+"_id"]: {
                    field :rk + "_id", 
                    operator :"eq", 
                    value :parentElementId, 
                },
            }
        }

    } else {
        return {
            filter: {
                [_.uniqueId("filt")+"_id"]: {
                    field :rk, 
                    operator: "eq", 
                    value: parentElementId, 
                },
            }
        }
    }
}


function getAllRelatedData(modelId, elementId) {
    var relatedStorage = {};



    var modelRelations = _.filter(g.getMetaModelsRelations(), (r) => {return r.model_id == modelId});
    //console.log(modelRelations)


    _.each(modelRelations, (rel,relk) => {
        rt =
            rel.relation_type
        rk =
            rel.relation_key
        relationModelId =
            rel.relation_model_id


        if (rt == RT.HAS_MANY || rt == RT.MORPH_MANY) {

            collectionSelector = relatedCollectionSelector({}, rt, rk, elementId, modelId);


/*
            collection =
                getItems relationModelId storage
                    |> selectItems collectionSelector
                    |> Tuple.first
                    |> List.map (\v -> ( getId v, v ))
                    |> Dict.fromList*/

        } else {

        }

    })


}


module.exports = getAllRelatedData;