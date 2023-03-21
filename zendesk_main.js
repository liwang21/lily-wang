var client = ZAFClient.init();
client.invoke('resize', {
    width: '100%',
    height: '600px'
});

let autoFillSearchBar = false;

client.metadata().then(function(metadata) {
    (function(d, script, answers) {
        answers = d.createElement("div");
        answers.id = "answers-container";

        script = d.createElement("script");
        script.async = true;

        let url = metadata.settings["Answers Experience Production URL"];
        if (!url.includes("iframe.js")) {
            if (!url.endsWith("/")) {
                url += "/";
            }
            url += "iframe.js";
        }
        script.src = url;

        autoFillSearchBar = metadata.settings["Auto Populate Search Bar"];

      script.onload = function() {
        AnswersExperienceFrame.runtimeConfig.set('linkTarget', '_blank');
        AnswersExperienceFrame.runtimeConfig.set('querySource', 'AGENT_DESKTOP');
        AnswersExperienceFrame.init({});
        client.get("ticket.subject").then(function(data) {
            if (data["ticket.subject"] && autoFillSearchBar) {
                document.getElementById("answers-container").firstElementChild.src += "&query=" + data["ticket.subject"];
            }
        });
      };

        d.getElementById("content").append(answers);
        d.getElementById("content").append(script);
    }(document));
});

let subjectChanged = false;

client.on('*.changed', function(data) {
    if (data["propertyName"] === "ticket.subject" && autoFillSearchBar) {
        client.get('ticket.subject').then(function(data) {
            if (data["ticket.subject"]) {
                subjectChanged = true;
            }
        });
    } else if (data["propertyName"] !== "ticket.subject" && subjectChanged && autoFillSearchBar) {
        client.get("ticket.subject").then(function(data) {
            if (data["ticket.subject"]) {
                  let newQuery = data["ticket.subject"];
                  let msg = JSON.stringify({"action": "setQuery", "value": newQuery});
                  let frameEl = document.getElementById("answers-frame");
                  frameEl.contentWindow.postMessage(msg, "*");
                  subjectChanged = false;
            }
        });
    }
});