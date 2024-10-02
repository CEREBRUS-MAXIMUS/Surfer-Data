const { ipcRenderer } = require('electron')

function customConsoleLog(id, ...args) {
  // Convert arguments to strings to avoid cloning issues
  const stringArgs = args.map((arg) =>
    typeof arg === 'object' ? JSON.stringify(arg) : arg,
  );
  ipcRenderer.sendToHost('console-log', id, ...stringArgs);
};

function waitForElement(
  id,
  selector,
  elementName,
  multipleElements = false,
  timeout = 10000,
) {

  if (!multipleElements){
    customConsoleLog(id, `Waiting for ${elementName}`);
  }

  return new Promise((resolve) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = multipleElements
        ? document.querySelectorAll(selector)
        : document.querySelector(selector);
      if (element) {
        if (!multipleElements){
          customConsoleLog(id, `Found ${elementName}`);
        }
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        customConsoleLog(id, `Timeout waiting for ${elementName}`);
        resolve(null);
      } else {
        setTimeout(checkElement, 100);
      }
    };

    checkElement();
  });
}

async function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

function bigStepper(id, step) {
  ipcRenderer.sendToHost('big-stepper', id, step);
}

async function waitForContentToStabilize() {
  return new Promise((resolve) => {
    let timeout;
    const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        observer.disconnect();
        console.log('Content has stabilized');
        resolve();
      }, 100); // Adjust this delay as needed
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Fallback in case the page never stabilizes
    setTimeout(() => {
      observer.disconnect();
      console.log('Timed out waiting for content to stabilize');
      resolve();
    }, 5000); // Adjust this timeout as needed
  });
}

const features = {
  graphql_timeline_v2_bookmark_timeline: true,
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  articles_preview_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};


module.exports = { customConsoleLog,waitForElement, wait, bigStepper, waitForContentToStabilize, features}