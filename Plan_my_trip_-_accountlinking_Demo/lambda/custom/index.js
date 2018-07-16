/* eslint-disable no-console */
/* eslint no-use-before-define: ["error", {"functions": false}] */
/* eslint-disable prefer-destructuring */

// 1. Text strings ================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function

const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
var https = require('https');
var accessToken;

const emoji = {
  'thumbsup': '\uD83D\uDC4D',
  'smile': '\uD83D\uDE0A',
  'star': '\uD83C\uDF1F',
  'robot': '\uD83E\uDD16',
  'germany': '\ud83c\udde9\ud83c\uddea',
  'uk': '\ud83c\uddec\ud83c\udde7',
  'trip': '\ud83d\uddfa',
  'usa': '\ud83c\uddfa\ud83c\uddf8'
}
// Escaped Unicode for other emoji:  https://github.com/wooorm/gemoji/blob/master/support.md

const bodyText = 'Welcome to plan my trip skill' + emoji.smile + 'This will be fun' + emoji.trip + ' \n'
  + 'Here is your link: \n'
  + 'https://www.youtube.com/channel/UCbx0SPpWT6yB7_yY_ik7pmg';

var welcomeOutput = "Let's plan a trip. Where would you like to go?";
const welcomeReprompt = "Let me know where you'd like to go or when you'd like to go on your trip";
const helpOutput = 'You can demonstrate the delegate directive by saying "plan a trip".';
const helpReprompt = 'Try saying "plan a trip".';
const tripIntro = [
  'This sounds like a cool trip. ',
  'This will be fun. ',
  'Oh, I like this trip. ',
];

// 2. Intent Handlers =============================================

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    var phoneNumber;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();
    if (handlerInput.requestEnvelope.context.System.user.accessToken !== undefined) {

      accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;

      try {
        var tokenOptions = buildHttpGetOptions(accessToken);

        var response = await httpGet(tokenOptions);
        console.log({ response });

        if (response.phone_number.length > 0) {
          phoneNumber = response.phone_number;
          sessionAttributes.phoneNumber = phoneNumber;
          const params = {
            PhoneNumber: sessionAttributes.phoneNumber,
            Message: bodyText
          };

          await sendTxtMessage(params);

        } else {
          return responseBuilder
            .speak("looks like some issue please disable the skill and reenable and try again")
            .reprompt("looks like some issue please disable the skill and reenable and try again")
            .getResponse();

        }
      } catch (error) {
        welcomeOutput = 'I am really sorry. I am unable to access part of my memory. Please try again later';
        console.log(`Error message: ${error.message}`);

      }
    }
    else {
      return responseBuilder
        .speak("to start using this skill, please use the companion app to authenticate on Amazon")
        .reprompt("to start using this skill, please use the companion app to authenticate on Amazon")
        .withLinkAccountCard()
        .getResponse();

    }

    return responseBuilder
      .speak(welcomeOutput)
      .reprompt(welcomeReprompt)
      .getResponse();
  },
};

const InProgressPlanMyTripHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      request.intent.name === 'PlanMyTripIntent' &&
      request.dialogState !== 'COMPLETED';
  },
  handle(handlerInput) {
    const currentIntent = handlerInput.requestEnvelope.request.intent;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    const params = {
      PhoneNumber: sessionAttributes.phoneNumber,
      Message: bodyText
    };

    return handlerInput.responseBuilder
      .addDelegateDirective(currentIntent)
      .getResponse();
  },
};

const CompletedPlanMyTripHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'PlanMyTripIntent';
  },
  async handle(handlerInput) {
    console.log('Plan My Trip - handle');

    const responseBuilder = handlerInput.responseBuilder;
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    const slotValues = getSlotValues(filledSlots);

    // compose speechOutput that simply reads all the collected slot values
    let speechOutput = getRandomPhrase(tripIntro);

    // activity is optional so we'll add it to the output
    // only when we have a valid activity
    if (slotValues.travelMode) {
      speechOutput += slotValues.travelMode;
    } else {
      speechOutput += "You'll go ";
    }

    // Now let's recap the trip
    speechOutput = `${speechOutput} from ${slotValues.fromCity.synonym} to ${slotValues.toCity.synonym} on ${slotValues.travelDate.synonym}`;

    if (slotValues.activity.synonym) {
      speechOutput += ` to go ${slotValues.activity.synonym}.`;
    }
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    const params = {
      PhoneNumber: sessionAttributes.phoneNumber,
      Message: speechOutput
    };
    console.log('Before sending message' + params.PhoneNumber.toString());

    await sendTxtMessage(params);

    return responseBuilder
      .speak(speechOutput)
      .getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    return responseBuilder
      .speak(helpOutput)
      .reprompt(helpReprompt)
      .getResponse();
  },
};

const CancelStopHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.CancelIntent' || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const responseBuilder = handlerInput.responseBuilder;
    const speechOutput = 'Okay, talk to you later! ';

    return responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(true)
      .getResponse();
  },
};

const SessionEndedHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const request = handlerInput.requestEnvelope.request;

    console.log(`Original Request was: ${JSON.stringify(request, null, 2)}`);
    console.log(`Error handled: ${error}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can not understand the command.  Please say again.')
      .reprompt('Sorry, I can not understand the command.  Please say again.')
      .getResponse();
  },
};

// 3. Helper Functions ============================================================================

function getSlotValues(filledSlots) {
  const slotValues = {};

  console.log(`The filled slots: ${JSON.stringify(filledSlots)}`);
  Object.keys(filledSlots).forEach((item) => {
    const name = filledSlots[item].name;

    if (filledSlots[item] &&
      filledSlots[item].resolutions &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
      filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
      switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
        case 'ER_SUCCESS_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
            isValidated: true,
          };
          break;
        case 'ER_SUCCESS_NO_MATCH':
          slotValues[name] = {
            synonym: filledSlots[item].value,
            resolved: filledSlots[item].value,
            isValidated: false,
          };
          break;
        default:
          break;
      }
    } else {
      slotValues[name] = {
        synonym: filledSlots[item].value,
        resolved: filledSlots[item].value,
        isValidated: false,
      };
    }
  }, this);

  return slotValues;
}

function getRandomPhrase(array) {
  // the argument is an array [] of words or phrases
  const i = Math.floor(Math.random() * array.length);
  return (array[i]);
}
const RequestLog = {

  process(handlerInput) {

    console.log("REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));

    return;

  }

};

// 4. Exports handler function and setup ===================================================
const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InProgressPlanMyTripHandler,
    CompletedPlanMyTripHandler,
    CancelStopHandler,
    HelpHandler,
    SessionEndedHandler,
)
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(RequestLog)
  .lambda();

// 5. Helper Function  =================================================================================================

var https = require('https');
// https is a default part of Node.JS.  Read the developer doc:  https://nodejs.org/api/https.html
// try other APIs such as the current bitcoin price : https://btc-e.com/api/2/btc_usd/ticker  returns ticker.last
//GET https://<your-user-pool-domain>/oauth2/userInfo
//Authorization: Bearer <access_token>
function buildHttpGetOptions(accessToken) {
  return {
    //Replace the host with your cognito user pool domain 
    host: '<your-user-pool-domain>',
    port: 443,
    path: '/oauth2/userInfo',
    method: 'GET',
    headers: {
      'authorization': 'Bearer ' + accessToken
    }
  };
}

function httpGet(options) {
  return new Promise(((resolve, reject) => {
    var request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      if (response.statusCode < 200 || response.statusCode >= 300) {
        return reject(new Error(`${response.statusCode}: ${response.req.getHeader('host')} ${response.req.path}`));
      }

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        console.log({ returnData });
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  }));
}

function sendTxtMessage(params) {

  var awssdk = require('aws-sdk');
  // Set region
  awssdk.config.update({ region: 'us-east-1' });

  // Create publish parameters
  // Create promise and SNS service object
  var publishTextPromise = new awssdk.SNS({ apiVersion: '2010-03-31' }).publish(params).promise();

  // Handle promise's fulfilled/rejected states
  publishTextPromise.then(
    function (data) {
      console.log("MessageID is " + data.MessageId);
    }).catch(
      function (err) {
        console.error(err, err.stack);
      });
}

