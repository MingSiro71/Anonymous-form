const HOOKS_URL = "https://hooks.slack.com/services/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";

class Message {
  constructor() {
    this._template = "" +
      "**該当コード**\n" +
      "```\n" +
      "{%= code %}\n" +
      "```\n"
  }
  publish() {
    const regexp = new RegExp('{%=.*%}');
    if (this._template.match(regexp)){
      return false;
    }
    return this._template;
  }
  fill(key, value) {
    const regexp = new RegExp('{%=\\s*'+key+'\\s*%}');
    if (this._template.match(regexp)){
      this._template = this._template.replace(regexp, value);
      return true;
    } else {
      return false;
    }
  }
}

const itemsToHide = ["氏名"];

const sendMessage = (message) => {
  const hooksUrl = HOOKS_URL;

  const body = message.publish();
  if (!body) { throw "Missing defined item in form." }

  const data = { "text" : body };
  const payload = JSON.stringify(data);
  const params = {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : payload
  };

  const response = UrlFetchApp.fetch(hooksUrl, params);
  const status = response.getResponseCode();
  if (typeof(status)!="number" || response.getResponseCode() > 400) {
    throw `Webhook returns error: status ${status}.`;
  } else {
    Logger.log(`Success. ${payload} `);
  }
}

const onSubmitForm = (e) => {
  const itemResponse = e.response.getItemResponses();
  const message = new Message;

  try{
    itemResponse.map(( input ) => {
      const title = input.getItem().getTitle();
      if (itemsToHide.includes(title)){ return }
      const response = input.getResponse();
      if (!message.fill(title, response)){
        throw `Undefined input title ${key}`;
      }
    })
    sendMessage(message);
  } catch(e) {
    Logger.log("Process failed." + e)
  }
}
