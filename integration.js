const request = require('request');
const async = require('async');
require('dotenv').config();

let Logger;
let apiKey = '';
let SILENTPUSH_API_URL;

function startup(logger){
    Logger = logger;
    SILENTPUSH_API_URL = process.env.SILENTPUSH_API_URL || "https://app.silentpush.com/api/"
}

doLookup = (entities, options, cb) => {
    Logger.info(entities);
    Logger.info(`apikey: ${options.apiKey}`);
    apiKey = options.apiKey;
    let lookupResults = [];
    async.each(entities, function(entity, next){
        if(entity.isIPv4) {
            enrichIPv4(entity, function (err, result) {
                if (!err) {
                    lookupResults.push(result); // add to our results if there was no error
                }
                next(err);  // processing complete
            });
        }else if(entity.isDomain) {
            enrichDomain(entity, function (err, result) {
                if (!err) {
                    lookupResults.push(result);
                }
                next(err);
            });
        }else if(entity.isURL){
            parseIoC(entity.value, function (parsedIoC) {
                Logger.info(`parsedIoC: ${parsedIoC}`);
                Logger.info(`entity before: ${JSON.stringify(entity)}`);
                entity.value = parsedIoC;
                Logger.info(`entity after: ${JSON.stringify(entity)}`);
                enrichDomain(entity, (err, result) => {
                    if (!err) {
                        lookupResults.push(result); // add to our results if there was no error
                    } else {
                        enrichIPv4(entity, (err, result) => {
                            if (!err) {
                                lookupResults.push(result);
                            }
                            next(err);
                        });
                    }
                    next(err);
                });
            });
        }else{
            next(null);
        }
    }, function(err){
        cb(err, lookupResults);
    });
}

enrichIPv4 = (entity, done) => {
    Logger.info(entity);
    request(getEnrichmentURI(entity), function(err, response, body){
        Logger.info(`enrichIPv4 error: ${err}`);
        Logger.info(`enrichIPv4 response: ${JSON.stringify(response)}`);
        Logger.info(`enrichIPv4 body: ${JSON.stringify(body)}`);
        if(err || response.statusCode !== 200){
            // return either the error object, or the body as an error
            done(err || body);
            return;
        }
        // there was no error in making the GET request so process the body here
        done(null, {
            entity: entity,
            data:{
                summary: [entity.value],
                details: body.response
            }
        });
    });
}

enrichDomain = (entity, done) => {
    Logger.info(entity);
    request(getEnrichmentURI(entity, "domain"), function(err, response, body){
        Logger.info(`enrichDomain error: ${err}`);
        Logger.info(`enrichDomain response: ${JSON.stringify(response)}`);
        Logger.info(`enrichDomain body: ${JSON.stringify(body)}`);
        if(err || response.statusCode !== 200){
            done(err || body);
            return;
        }
        done(null, {
            entity: entity,
            data:{
                summary: [entity.value],
                details: body.response
            }
        });
    });
}

getEnrichmentURI = (entity, type = "ipv4") => {
    const enrichment_url = SILENTPUSH_API_URL +
        `v1/merge-api/explore/enrich/${type}/${entity.value}` +
        '?explain=1&scan_data=1&with_metadata=1&query_type=Enrichment&' +
        'query_origin=ENRICHMENT&is_voluntary=1';
    return {
        url: enrichment_url,
        json: true,
        // verify: false,
        headers: {
            "X-Api-Key": apiKey,
            "User-Agent": "PolarityIO"
        }
    };
}

parseIoC = (ioc, done) => {
    const uri = {
        url: SILENTPUSH_API_URL + 'v2/utils/parse-ioc/',
        body: {ioc: ioc},
        json: true,
        // verify: false,
        headers: {
            "X-Api-Key": apiKey,
            "User-Agent": "PolarityIO"
        }
    };
    request.post(uri, function(err, response, body){
        Logger.info(`parseIoC error: ${err}`);
        Logger.info(`parseIoC response: ${JSON.stringify(response)}`);
        Logger.info(`parseIoC body: ${JSON.stringify(body)}`);
        done(body.result);
    });
}

// function onDetails(lookupObject, options, callback)
// function onMessage(payload, options, cb)
// function validateOptions(userOptions, cb)

module.exports = {
    startup: startup,
    doLookup: doLookup
};