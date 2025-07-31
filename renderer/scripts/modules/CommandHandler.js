/**
 * CommandHandler - Handles system commands and actions
 * Responsibilities:
 * - System command execution
 * - Result selection and actions
 * - External integrations (Google, ChatGPT, etc.)
 * - Application control (quit, reload, etc.)
 */
import { showHelpDialog } from "./utils/utils.js";
import { handleGoogleSearch } from "./utils/googleSearch.js";
import { handleChatGPTSearch } from "./utils/chatgptSearch.js";
import { showSumCalculator } from "./utils/sum.js";
import { showWeatherDialog } from "./utils/weather.js";
import { showDogDialog } from "./utils/fun/dog.js";
import { showCatDialog } from "./utils/fun/cat.js";
import { showMemeDialog } from "./utils/fun/memetemplate.js";
import { showCoinGeckoApiDialog } from "./utils/crypto.js";
import { showWaifuDialog } from "./utils/fun/waifu.js";
import { getColorInfo } from "./utils/color.js";
import { showSearchDialog } from "./utils/fun/movie.js";

export class CommandHandler {
  constructor(resultsContainer, emojiPicker, formManager, uiManager, searchManager) {
    this.resultsContainer = resultsContainer;
    this.emojiPicker = emojiPicker;
    this.formManager = formManager;
    this.uiManager = uiManager;
    this.searchManager = searchManager;
  }

  async selectResult(index, results) {
    const result = results[index];
    if (!result) return;

    console.log("Selecting result:", result);

    if (result.type === "emoji") {
      const copyResult = await this.emojiPicker.selectEmoji(result.data);
      if (copyResult.success) {
        console.log(copyResult.message);
      }
      return;
    } else if (result.type === "system") {
      await this.handleSystemCommand(result.id, result);
      return;
    } else if (result.type === "snippet") {
      await navigator.clipboard.writeText(result.data.content);
    } else if (result.type === "document") {
      window.electronAPI.openExternal(result.data.link);
    } else if (result.type === "bookmark") {
      window.electronAPI.openExternal(result.data.url);
    } else if (result.type === "tool") {
      window.electronAPI.openExternal(result.data.url);
    }

    window.electronAPI.hideWindow();
  }

  async handleSystemCommand(commandId, result = null) {
    console.log("Handling system command:", commandId);

    switch (commandId) {
      case "back":
        this.exitEmojiMode();
        break;

      case "settings":
        await window.electronAPI.openSettings();
        window.electronAPI.hideWindow();
        break;

      case "emoji":
        this.enterEmojiMode();
        break;

      case "help":
        showHelpDialog(this.resultsContainer);
        break;

      case "movie":
        showSearchDialog(this.resultsContainer, "Stranger T");
        break;

      case "color":
        const colorInfo = await getColorInfo({ hex: "#ff0000" });
        console.log("Color info:", colorInfo);
        break;

      case "coingecko":
        showCoinGeckoApiDialog(this.resultsContainer);
        break;

      case "meme":
        showMemeDialog(this.resultsContainer);
        break;

      case "dog":
        showDogDialog(this.resultsContainer);
        break;

      case "cat":
        showCatDialog(this.resultsContainer);
        break;

      case "weather":
        showWeatherDialog(this.resultsContainer);
        break;

      case "quit":
        window.electronAPI.quitApp();
        break;

      case "reload":
        await this.searchManager.loadData();
        this.onReloadComplete();
        break;

      case "sum":
        showSumCalculator(this.resultsContainer, () => {
          this.onBackToSearch();
        });
        break;

      case "add-snippet":
        this.formManager.showAddSnippetForm();
        break;

      case "add-document":
        this.formManager.showAddDocumentForm();
        break;

      case "add-bookmark":
        this.formManager.showAddBookmarkForm();
        break;

      case "tools":
        this.uiManager.showToolsDirectory(this.searchManager.getTools());
        break;

      case "google-search":
        await handleGoogleSearch(result?.data?.searchQuery);
        break;

      case "chatgpt-search":
        await handleChatGPTSearch(result?.data?.searchQuery);
        break;

      default:
        console.log("Unknown system command:", commandId);
    }
  }

  // Emoji mode methods
  enterEmojiMode() {
    // Emit event for emoji mode entry
    this.resultsContainer.dispatchEvent(
      new CustomEvent("enterEmojiMode")
    );
  }

  exitEmojiMode() {
    // Emit event for emoji mode exit
    this.resultsContainer.dispatchEvent(
      new CustomEvent("exitEmojiMode")
    );
  }

  // Callback methods
  onReloadComplete() {
    this.resultsContainer.dispatchEvent(
      new CustomEvent("reloadComplete")
    );
  }

  onBackToSearch() {
    this.resultsContainer.dispatchEvent(
      new CustomEvent("backToSearch")
    );
  }
}