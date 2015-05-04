/**
 * CS50 IDE
 * Simplifies Cloud9 IDE for those less comfortable.
 *
 */
define(function(require, exports, module) {
    "use strict";

    main.consumes = [
        "Plugin", "ace", "ace.status", "commands", "console", "Divider",
        "immediate", "keymaps", "layout", "Menu", "MenuItem", "menus", "mount",
        "panels", "preferences", "preview", "run.gui", "save", "settings",
        "tabManager", "terminal", "tooltip", "tree", "ui"
    ];
    main.provides = ["cs50.simple"];
    return main;

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var ui = imports.ui;
        var menus = imports.menus;
        var layout = imports.layout;
        var tabs = imports.tabManager;
        var settings = imports.settings;
        var status = imports["ace.status"];
        var basename = require("path").basename;
        var commands = imports.commands;

        var plugin = new Plugin("Ajax.org", main.consumes);

        var COOKIE_NAME = "cs50ide-comfort";

        var lessComfortable = false;
        var complexMenus = findComplexMenus();

        // code from gui.js
        function findTabToRun(){
            var path = tabs.focussedTab && tabs.focussedTab.path;
            if (path) return path.replace(/^\//, "");

            var foundActive;
            if (tabs.getPanes().every(function(pane) {
                var tab = pane.activeTab;
                if (tab && tab.path) {
                    if (foundActive) return false;
                    foundActive = tab;
                }
                return true;
            }) && foundActive) {
                return foundActive.path.replace(/^\//, "");
            }

            return false;
        }

        /*
         * Cookie functions to remember comfort level
         * From http://www.w3schools.com/js/js_cookies.asp
         */
        function setCookie(cname, cvalue, exdays) {
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
        }

        function getCookie(cname) {
            var name = cname + "=";
            var ca = document.cookie.split(';');
            for(var i=0; i<ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0)==' ')
                    c = c.substring(1);

                if (c.indexOf(name) == 0)
                    return c.substring(name.length, c.length);
            }
            return "";
        }

        /*
         * Hides the given div by changing CSS
         * @return true if successfuly hides, false otherwise
         */
        function hide(div) {
            if (div && div.$ext && div.$ext.style) {
                div.$ext.style.display = "none";
                return true;
            }
            else {
                return false;
            }
        }

        /*
         * Shows the given div by changing CSS
         * @return true if successfully shows, false otherwise
         */
        function show(div) {
            if (div && div.$ext && div.$ext.style) {
                div.$ext.style.display = "";
                return true;
            }
            else {
                return false;
            }
        }

        /*
         * Finds the complex menus that this plugin removes
         */
        function findComplexMenus() {
            var complexMenus = [];

            // Cloud9 Menu
            complexMenus.push(menus.get("Cloud9"));

            // File Menu
            complexMenus.push(menus.get("File/Revert to Saved"));
            complexMenus.push(menus.get("File/Revert All to Saved"));
            complexMenus.push(menus.get("File/Mount FTP or SFTP server"));
            complexMenus.push(menus.get("File/Line Endings"));

            // Edit Menu
            complexMenus.push(menus.get("Edit/Line/Move Line Up"));
            complexMenus.push(menus.get("Edit/Line/Move Line Down"));
            complexMenus.push(menus.get("Edit/Line/Copy Lines Up"));
            complexMenus.push(menus.get("Edit/Line/Copy Lines Down"));
            complexMenus.push(menus.get("Edit/Line/Remove Line"));
            complexMenus.push(menus.get("Edit/Line/Remove to Line End"));
            complexMenus.push(menus.get("Edit/Line/Remove to Line Start"));
            complexMenus.push(menus.get("Edit/Line/Split Line"));
            complexMenus.push(menus.get("Edit/Keyboard Mode"));
            complexMenus.push(menus.get("Edit/Selection"));
            complexMenus.push(menus.get("Edit/Text"));
            complexMenus.push(menus.get("Edit/Code Folding"));
            complexMenus.push(menus.get("Edit/Code Formatting"));

            // View Menu
            complexMenus.push(menus.get("View/Syntax"));
            complexMenus.push(menus.get("View/Wrap Lines"));
            complexMenus.push(menus.get("View/Wrap to Print Margin"));

            // Goto Menu
            complexMenus.push(menus.get("Goto/Goto Anything..."));
            complexMenus.push(menus.get("Goto/Goto Symbol..."));
            complexMenus.push(menus.get("Goto/Word Right"));
            complexMenus.push(menus.get("Goto/Word Left"));
            complexMenus.push(menus.get("Goto/Scroll to Selection"));

            // Run Menu
            complexMenus.push(menus.get("Run"));

            // Tools Menu
            complexMenus.push(menus.get("Tools"));

            return complexMenus;

        }

        /*
         * Toggles the status bar in the bottom right corner of Ace
         */
        function toggleStatusBar(lessComfortable) {
            lessComfortable ? status.hide() : status.show();
        }

        /*
         * Toggles simplification of the menus at the top of Cloud 9
         */
        function toggleMenus(complexMenus, lessComfortable) {

            // toggles visibility of each menu item
            complexMenus.forEach(function(element, index, array) {
                if (element.item) {
                    element.item.setAttribute("visible", !lessComfortable);
                }
            });

            // Tidy up dividers
            menus.get("File").menu.childNodes[14].setAttribute("visible", !lessComfortable);
            menus.get("Edit").menu.childNodes[6].setAttribute("visible", !lessComfortable);
            menus.get("Goto").menu.childNodes[7].setAttribute("visible", !lessComfortable);
            menus.get("Goto").menu.childNodes[16].setAttribute("visible", !lessComfortable);
        }

        /*
         * Toggles Preview Button
         */
        function togglePreview(lessComfortable) {
            // determines whether to show or hide
            var toggle = lessComfortable ? hide : show;

            // gets the menu bar that holds the preview and debug buttons
            var bar = layout.findParent({ name: "preview" });

            // toggles divider
            toggle(bar.childNodes[0]);

            // toggles preview button
            toggle(bar.childNodes[1]);
        }

        /*
         * Switches the Run button to say Debug
         */
        function runToDebug() {
            var runButton = layout.findParent({ name: "preview" }).childNodes[2];
            runButton.$ext.childNodes[3].innerHTML = "Debug";

            function updateTip() {
                var path = basename(findTabToRun());
                runButton.setAttribute("tooltip", "Run and debug " + path);
            }

            // Updates the tooltip to Run and debug
            updateTip();
            tabs.on("focus", updateTip);
        }

        /*
         * Toggles the button in top left that minimizes the menu bar
         */
        function toggleMiniButton(lessComfortable) {
            var miniButton = layout.findParent(menus).childNodes[0].childNodes[0];
            lessComfortable ? hide(miniButton) : show(miniButton);
        }

        /*
         * Toggles the left Navigate and Commands side tabs
         */
        function toggleSideTabs(lessComfortable) {
            var navigate = menus.get("Window/Navigate").item;
            var commands = menus.get("Window/Commands").item;

            // toggle Navigate: hide if less comfortable, show otherwise
            if (navigate.checked == lessComfortable)
                menus.click("Window/Navigate");

            // toggle Commands: hide if less comfortable, show otherwise
            if (commands.checked == lessComfortable)
                menus.click("Window/Commands");
        }

        /*
         * Toggles menu simplification that you get when you click the plus icon
         */
        function togglePlus(lessComfortable) {
            var toggle = lessComfortable ? hide : show;

            // finds the menu bar and then executes callback
            tabs.getElement("mnuEditors", function(menu) {

                var menuItems = menu.childNodes;
                // tries to toggle the menu items on the plus sign
                // until it works (sometimes this is called before they load)
                var test = setInterval(function (){
                    if (toggle(menuItems[2]) &&
                        toggle(menuItems[3]) &&
                        toggle(menuItems[4]) &&
                        toggle(menuItems[5]) &&
                        toggle(menuItems[6])) {
                        clearInterval(test);
                    }
                }, 0);
            });
        }

        /*
         * Adds tooltips to maximize and close the console
         */
        function addToolTip(div) {
            div.childNodes[0].setAttribute("tooltip", "Maximize");
            div.childNodes[2].setAttribute("tooltip", "Close Console");
        }

        /*
         * Find the console buttons and add tooltips
         */
        function addTooltips() {

            // adds tooltips as a callback after the consoleButtons are created
            imports.console.getElement("consoleButtons", addToolTip);
        }

        /*
         * Adds the button to toggle comfort level
         */
        function addToggle(plugin) {

            // creates the toggle menu item
            var toggle = new ui.item({
                type: "check",
                caption: "Less Comfortable",
                onclick: toggleSimpleMode
            });

            // places it in View
            menus.addItemByPath("View/Less Comfortable", toggle, 800, plugin);
        }

        /*
         * Creates a button to change Terminal font size
         */
        function terminalFontSizeButton(){

            // Add keyboard hotkeys
            commands.addCommand({
                name: "largerterminalfont",
                hint: "increase terminal font size",
                bindKey: { mac: "Command-Ctrl-=|Command-Ctrl-+",
                           win: "Meta-Ctrl-=|Meta-Ctrl-+" },
                group: "Terminal",
                exec: function() {
                    var fsize = settings.getNumber("user/terminal/@fontsize");

                    // default size
                    if (fsize == 0)
                        fsize = 12;

                    // increase size, unless it will take us over 72
                    fsize = ++fsize > 72 ? 72 : fsize;

                    // Update both the int and string forms of fontsize
                    settings.set("user/terminal/@fontsize", fsize);
                }
            }, plugin);

            commands.addCommand({
                name: "smallerterminalfont",
                hint: "decrease terminal font size",
                bindKey: { mac: "Command-Ctrl--", win: "Meta-Ctrl--" },
                group: "Terminal",
                exec: function() {
                    var fsize = settings.getNumber("user/terminal/@fontsize");

                    // default size
                    if (fsize == 0)
                        fsize = 12;

                    // decrease size, unless it will take us below 1
                    fsize = --fsize < 1 ? 1 : fsize;

                    // Update both the int and string forms of fontsize
                    settings.set("user/terminal/@fontsize", fsize);
                }
            }, plugin);

            menus.addItemByPath("View/Terminal Font Size/", null, 290000, plugin);
            menus.addItemByPath("View/Terminal Font Size/Increase Terminal Font Size",
                new ui.item({
                    caption: "Increase Terminal Font Size",
                    command: "increaseterminalfont"
                }), 100, plugin);
            menus.addItemByPath("View/Terminal Font Size/Decrease Terminal Font Size",
                new ui.item({
                    caption: "Decrease Terminal Font Size",
                    command: "decreaseterminalfont",
                }), 200, plugin);

        }

        /*
        * Toggles whether or not simple mode is enabled
        */
        function toggleSimpleMode(unload) {

            // if we're unloading, remove menu customizations but don't save
            if (unload === true)
                lessComfortable = false;
            else {
                // Toggles comfort level
                lessComfortable = !lessComfortable;
                setCookie(COOKIE_NAME, lessComfortable ? "less" : "more", 150);
            }

            // Toggles features
            toggleMenus(complexMenus, lessComfortable);
            togglePreview(lessComfortable);
            toggleStatusBar(lessComfortable);
            toggleMiniButton(lessComfortable);
            toggleSideTabs(lessComfortable);
            togglePlus(lessComfortable);

            // Makes sure that the checkbox is correct
            menus.get("View/Less Comfortable").item.checked = lessComfortable;

        }


        /***** Initialization *****/

        var loaded = false;
        function load() {
            if (loaded)
               return false;
            loaded = true;

            // Adds the permanent changes
            addToggle(plugin);
            addTooltips();
            runToDebug();
            terminalFontSizeButton();

            // initialize less comfortable mode by default and when requested
            if (getCookie(COOKIE_NAME) != "more")
                menus.click("View/Less Comfortable");
        }



        /***** Lifecycle *****/

        plugin.on("load", function(){
            load();
        });

        plugin.on("unload", function() {
            toggleSimpleMode(true);
            loaded = false;
            lessComfortable = false;
        });

        /***** Register and define API *****/

        /**
         * Left this empty since nobody else should be using our plugin
         **/
        plugin.freezePublicAPI({ });

        register(null, { "cs50.simple" : plugin });
    }
});
