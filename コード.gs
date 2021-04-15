// "ts" in this project means timestamp, which is commonly used in slack app. (not "type script"!)

// TEST in Developper Channel
const HOOKS_URL = "https://hooks.slack.com/services/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";

// TEST in Miyake'sLab. account
// const HOOKS_URL = "https://hooks.slack.com/services/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";

const itemsNoUse = ["氏名"];

const TORELABLE_TIME_LAG = 0.5; // sec.
const REQUEST_INTERVAL = 0.01; // sec.

class Message {
  constructor() {
    this._template = "" +
      "\* 該当コード \*\n" +
      "```\n" +
      "{%= code %}\n" +
      "```\n"
  }
  publish() {
    const regexp = new RegExp('{%=.*%}');
    if (this._template.match(regexp)) {
      throw "Missing defined item in form."
    }
    return this._template;
  }
  fill(key, value) {
    const regexp = new RegExp('{%=\\s*' + key + '\\s*%}');
    if (this._template.match(regexp)) {
      this._template = this._template.replace(regexp, value);
    } else {
      throw `Undefined input title ${key}`
    }
  }
}

class UrlFetchAppClient {
  constructor(url, params) {
    this._url = url,
      this._params = params;
    this._requestInterval = REQUEST_INTERVAL;
  }
  fetch() {
    return UrlFetchApp.fetch(this._url, this._params);
  }
}

class SlackIncomingWebhooksClient extends UrlFetchAppClient {
  constructor() {
    const params = {
      method: "POST",
      contentType: "application/json",
      payload: undefined
    };
    super(HOOKS_URL, params);
    this._threadTs = undefined;
    this._torelableTimeTag = TORELABLE_TIME_LAG;
  }
  generateTs() {
    const timeInGoogle = new Date;
    return timeInGoogle.getTime();
  }
  fetch(messageData) {
    if (this._threadTs) {
      messageData['thread_ts'] = this._threadTs;
    }
    this._params.payload = JSON.stringify(messageData);
    const response = super.fetch();

    const status = response.getResponseCode();
    if (typeof (status) != "number" || response.getResponseCode() > 400) {
      throw `Webhook returns error: status ${status}.`;
    } else {
      return response;
    }
  }
  crawlTs(baseTs) {

  }
  getThreadTs() {
    return this._threadTs;
  }
  setThreadTs(threadTs) {
    if (!threadTs.match(/[0-9]+\.000[0-9]00/)) {
      throw 'Invalid format of thread_ts'
    }
    this._threadTs = threadTs;
  }
}

const sendMessage = (client, message) => {
  const hooksUrl = HOOKS_URL;

  const body = message.publish();
  const messageData = { "text": body };

  const beforeTsInGoogle = client.generateTs()
  const response = client.fetch(messageData);
  const afterTsInGoogle = client.generateTs();

  if (response) { Logger.log("Post success.") }
  if (client.getThreadTs()) { return }

  const averageTsInGoogle = (beforeTsInGoogle + afterTsInGoogle) / 2;
  const supporsedPostedThreadTs = client.crawlTs(averageTsInGoogle);

  client.setThreadTs(supporsedPostedThreadTs);
  const indecateThreadTsMessageData = {
    "thread_ts": supporsedPostedThreadTs,
    "text": `Use this id to reply\n${supporsedPostedThreadTs}`
  }
  client.fetch(messageData);

  Logger.log("Before post" + beforeTsInGoogle);
  Logger.log("After post" + afterTsInGoogle);
}

const onSubmitForm = (e) => {
  const itemResponse = e.response.getItemResponses();
  const message = new Message;
  const client = new SlackIncomingWebhooksClient;

  try {
    itemResponse.map((input) => {
      const title = input.getItem().getTitle();

      if (title === "スレッドID") {
        const threadTs = input.getResponse();
        try {
          client.setThreadTs(threadTs);
        } catch (e) {
          // Do nothing
        }
        return;
      }
      if (itemsNoUse.includes(title)) { return }
      const response = input.getResponse();

      message.fill(title, response);
    })
    sendMessage(client, message);
  } catch (e) {
    Logger.log("Process failed." + e)
  }
}

class MockEvent {
  constructor(response) {
    this.response = response;
  }
}

class MockResponse {
  constructor(itemResponses) {
    this._itemResponses = itemResponses;
  }
  getItemResponses() {
    return this._itemResponses;
  }
}

class MockInput {
  constructor(item, response) {
    this._item = item;
    this._response = response;
  }
  getItem() {
    return this._item;
  }
  getResponse() {
    return this._response;
  }
}

class MockItem {
  constructor(title = "") {
    this._title = title;
  }
  getTitle() {
    return this._title;
  }
}

// Testkit
class TestKit {
  static willThrow(func, args) {
    try {
      func(...args);
    } catch (e) {
      return true;
    }
    return false;
  }

  static testDo(testname, boolval) {
    if (boolval) {
      console.debug(`${testname}: OK`);
    } else {
      console.debug(`${testname}: NG`);
    }
  }
}

// Unit tests

const testMessagefill = () => {
  const message = new Message;
  TestKit.testDo(
    "Well done when item is in template",
    !TestKit.willThrow(message.fill.bind(message), ['code', 'qwertyuio'])
  )
  TestKit.testDo(
    "Exression for item is replaced",
    message._template.match(/qwertyuio/)
  );
  TestKit.testDo(
    "Throw error when item is not in template",
    TestKit.willThrow(message.fill.bind(message), ['something not exist item name', 'qwertyuio'])
  )
}

const testMessagePublish = () => {

}

const testSlackIncomingWebhooksClientThreadTs = () => {
  const client = new SlackIncomingWebhooksClient;
  client.setThreadTs("1618462428.002100");

  TestKit.testDo(
    "Well done when item is in template",
    (client.getThreadTs() === "1618462428.002100")
  )
}

const testSlackIncomingWebhooksClientGenerateTs = () => {

}

const testSlackIncomingWebhooksClientCrawlTs = () => {

}

const testNewQuestion = () => {
  const mock_event = new MockEvent(
    new MockResponse([
      new MockInput(
        new MockItem(title = '氏名'),
        'テストユーザー'
      ),
      new MockInput(
        new MockItem(title = 'スレッドID'),
        ''
      ),
      new MockInput(
        new MockItem(title = 'code'),
        'function testcode () {\n  console.log("test now.")\n}'
      ),
    ])
  );
  onSubmitForm(mock_event);
}

// Local Development only
// class Logger {
//   static log () {}
// }