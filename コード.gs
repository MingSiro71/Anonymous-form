const HOOKS_URL = ""

class Message {
  constructor() {
    this._template = "" +
      "**該当コード**\n" +
      "```\n" +
      "[?= code ]\n" +
      "```\n"
  }
  publish(){
    const regexp = new RegExp("[?=.*]");
    if (this._template.match(regexp)){
      Logger.log(`Missing defined item from form.`);
      throw Exception;      
    }
    return this._template;
  }
  fill(key, value) {
    const regexp = new RegExp("[?=\s*"+key+"\s*]");
    if (this._template.match(regexp)){
      this._template = this._template.replace(regexp, value);
    } else {
      Logger.log(`Undefined input title ${key}`);
      throw Exception;
    }
  }
}

const itemsToHide = ["name"];

const sendMessage = (message) => {
  const hooksUrl = HOOKS_URL;

  const data = { "text" : message.publish };
  const payload = JSON.stringify(data);
  const params = {
    "method" : "POST",
    "contentType" : "application/json",
    "payload" : payload
  };
  const response = UrlFetchApp.fetch(hooksUrl, params);
  const status = response.getResponseCode();
  if (typeof(status)!="Number" || response.getResponseCode() > 400) {
    Logger.log(`Webhook returns error: status ${status}.`);
  } 
}

const onSubmitForm = (e) => {
  const itemResponse = e.response.getItemResponses();
  const message = new Message;

  itemResponse.map(( input ) => {
    const title = input.getItem().getTitle();
    if (itemsToHide.includes(title)){ return }
    const response = input.getResponse();
    message.fill(title, response);
  })

  sendMessage(message);
}
