
/*
  global objects from 3rd party js libraries

  window.zip
  https://github.com/gildas-lormeau/zip.js

  window.idbKeyval
  https://github.com/jakearchibald/idb-keyval

*/


const app = {


  //#region ******************************* SETTINGS *******************************

  // this shows the debug button on the home page and
  // the json object below the form on the form page
  debugMode: true,

  // show a confirm dialog when deleting things
  confirmDelete: true,

  // the currently selected text translation
  currentLanguage: "en",

  // text translations
  translations: {
    en: { // english
      // html strings
      homePageHeading: "My Forms",
      homePageCreateForm: "Create Form",
      formPageHeading: "Edit Form",

      // javascript strings
      createFormPrompt: "Enter a name",
      invalidFormNameLength: "Invalid Filename.  Maximum of 50 characters allowed",
      invalidFormNameChars: "Invalid Filename.  Only letters, numbers, spaces and underscrore are allowed",
      deleteFormPrompt: "Delete this form?",
      homePageNoForms: "No Forms",
      formPageLoading: "Loading",
      formNotFoundError: "Data for this form not found",
      deleteFormItemPrompt: "Delete this item?",
      selectFileButtonLabel: "Select a file",
      updatingElementNameIndexesError: "Error updating element name indexes",
      overwriteExistingForm: "A file with the name ${} already exists.  Would you like to overwrite it?",
      importFileTypeError: "Only ${} files can be imported"
    },
    nl: { // dutch
      // html strings
      homePageHeading: "My Forms",
      homePageCreateForm: "Create Form",
      formPageHeading: "Edit Form",

      // javascript strings
      createFormPrompt: "Enter a name",
      invalidFormNameLength: "Invalid Filename.  Maximum of 50 characters allowed",
      invalidFormNameChars: "Invalid Filename.  Only letters, numbers, spaces and underscrore are allowed",
      deleteFormPrompt: "Delete this form?",
      homePageNoForms: "No Forms",
      formPageLoading: "Loading",
      formNotFoundError: "Data for this form not found",
      deleteFormItemPrompt: "Delete this item?",
      selectFileButtonLabel: "Select a file",
      updatingElementNameIndexesError: "Error updating element name indexes",
      overwriteExistingForm: "A file with the name ${} already exists.  Would you like to overwrite it?",
      importFileTypeError: "Only ${} files can be imported"
    }
  },

  // this returns the json schema which is used to define a default form.  It can be changed
  // at any time because when creating a new form a copy of this schema is included with
  // the form data.  There are a few rules to follow when updating the schema as shown below
  getJsonSchema: function () {
    /*
      JSON SCHEMA RULES
      - property names cannot contain dot "." symbols
      - property names cannot be numbers
      - properties where the value is a file must be named "image" or "file" or end with "_file"
      - properties must have a sample value of the correct type (file type is just a string)
      - arrays must contain at least one sample object
      - array objects in the same array must have the same property names
      - array objects in the same array must have the same number of properties
    */

    // start schema
    const jsonSchema = {
      "general": {
        "street": "frederik tennislaan",
        "number": "482 - 232",
        "zip code": "4980EZ",
        "image": "img/object.jpg"
      },
      "location": [
        {
          "number": 1,
          "name": "bedroom left",
          "image": "img/bedroom.jpg",
          "air sample": {
            "temperature": 44.3,
            "humidity": 43.4,
            "co2": 432,
            "yeast_fungi": [
              {
                "species": "",
                "number": 9
              },
            ],
            "bacteria": [
              {
                "species": ["Bacteria 1", "Bacteria 2", "Bacteria 3"],
                "number": 999
              }
            ]
          },
          "particles": {
            "measurements": [
              {
                "kind": "2.5um",
                "quantity": 400
              },
            ]
          },
          "hcoc": {
            "measurement": 0.01
          }
        },
      ]
    };
    // end schema

    return jsonSchema;
  },

  //#endregion *********************************************************************


  // selected translation object
  i18n: null,

  // throttles saving to database
  debounceTimeout: null,

  // form currently being edited
  currentForm: {},

  // references to frequestly used html elements
  homePageEl: null,
  homePageListEl: null,
  formPageEl: null,
  formPageFormEl: null,
  formPageImageDialogEl: null,
  formPageImageDialogImageEl: null,
  debugPageEl: null,


  // runs when window loaded
  init: async function () {
    this.i18n = this.translations[this.currentLanguage];

    // get page elements
    this.homePageEl = document.getElementById("home-page");
    this.homePageListEl = document.getElementById("home-form-list");
    this.formPageEl = document.getElementById("form-page");
    this.formPageFormEl = document.getElementById("form-page-form");
    this.formPageImageDialogEl = document.getElementById("form-page-image-dialog");
    this.formPageImageDialogImageEl = document.getElementById("form-page-image-dialog-image");
    this.debugPageEl = document.getElementById("debug-page");
    this.debugDataEl = document.getElementById("debug-form-data");

    // add strings to html
    this.homePageEl.querySelector(".page-header > h1").textContent = this.i18n.homePageHeading;
    this.homePageEl.querySelector("#home-create-form-button").textContent = this.i18n.homePageCreateForm;
    this.formPageEl.querySelector(".page-header > h1").textContent = this.i18n.formPageHeading;

    // add delegated event handlers
    this.homePageEl.addEventListener("click", this.homePageClick.bind(this));
    this.formPageEl.addEventListener("click", this.formPageClick.bind(this));
    this.formPageEl.addEventListener("input", this.formPageInput.bind(this));
    this.formPageEl.addEventListener("change", this.formPageChange.bind(this));
    this.formPageEl.addEventListener("submit", (e) => { e.preventDefault(); });
    this.debugPageEl.addEventListener("click", this.debugPageClick.bind(this));

    // load home page forms
    await this.goToHomePage();
    // await this.goToFormsPage("asdf");
    this.updateFormDebug();
  },




  //#region Home Page


  goToHomePage: async function () {
    this.debugPageEl.style.display = "none";
    this.formPageEl.style.display = "none";
    this.homePageEl.style.display = "block";
    this.debugDataEl.style.display = "none";
    document.getElementById("home-debug-button").style.display = this.debugMode ? "inline-block" : "none";

    // empty home page form list
    this.homePageListEl.innerHTML = "";

    // get form names from database
    const formNames = await this.loadKeysFromDb();

    if (formNames.length) {

      // add home page list elements
      const frag = document.createDocumentFragment();
      formNames.forEach(formName => {
        const template = this.getTemplate("home-list-item-template");
        template.querySelector("label").textContent = formName;
        frag.appendChild(template);
      });
      this.homePageListEl.appendChild(frag);

    } else {
      this.showHomePageListEmpty();
    }
  },


  homePageClick: async function (e) {
    if (e.target.id === "home-create-form-button") {
      const name = this.getHomePageCreateFormName();
      if (!name) return;
      this.goToFormsPage(name, true);

    } else if (e.target.id === "home-import-button") {
      if (await this.importZipFile()) {
        await this.goToHomePage(); // reloads home page which reloads list items
      }

    } else if (e.target.classList.contains("home-list-item-edit-button")) {
      const formName = e.target.parentElement.querySelector("label").textContent;
      await this.goToFormsPage(formName);

    } else if (e.target.classList.contains("home-list-item-download-button")) {
      const formName = e.target.parentElement.querySelector("label").textContent;
      await this.exportZipFile(formName);

    } else if (e.target.classList.contains("home-list-item-delete-button")) {
      this.homePageDeleteListItem(e.target);

    } else if (e.target.id === "home-debug-button") {
      this.goToDebugPage();
    }
  },


  getHomePageCreateFormName: function () {
    let name = prompt(this.i18n.createFormPrompt)?.trim();
    if (!name) return;

    if (name.length > 50) {
      alert(this.i18n.invalidFormNameLength);
      return;
    }

    if (~name.indexOf("/") || ~name.indexOf(":") || ~name.indexOf("\"")) {
      alert(this.i18n.invalidFormNameChars);
      return;
    }

    return name;
  },


  homePageDeleteListItem: async function (el) {
    if (this.confirmDelete && !confirm(this.i18n.deleteFormPrompt)) return;

    const listItem = el.closest(".home-list-item");
    const formName = el.parentElement.querySelector("label").textContent;
    listItem.remove();
    await this.deleteFromDb(formName);
    this.showHomePageListEmpty();
  },


  showHomePageListEmpty: function () {
    if (!this.homePageListEl.children.length) {
      this.homePageListEl.insertAdjacentHTML("afterbegin",
        `<label class='center' style='font-weight: bold;'>${this.i18n.homePageNoForms}</label>`);
    }
  },


  //#endregion




  //#region Form Page


  goToFormsPage: async function (formName, isCreate) {
    this.debugPageEl.style.display = "none";
    this.homePageEl.style.display = "none";
    this.formPageEl.style.display = "block";

    // clear existing form
    this.formPageFormEl.innerHTML = "";

    // show loading label
    this.formPageFormEl.insertAdjacentHTML("afterbegin",
      `<label class='center'>${this.i18n.formPageLoading}</label>`);

    // create new form
    if (isCreate) {

      // create new form object
      this.currentForm = this.getNewFormObject(formName);

      await this.saveCurrentFormToDb();

    // load existing form
    } else if (formName) {
      const formData = await this.loadFromDb(formName);
      if (!formData) {
        alert(this.i18n.formNotFoundError);
        this.goToHomePage();
        return;
      }

      this.currentForm = formData;
    }

    // create form elements
    const frag = document.createDocumentFragment();
    this.createFormElementsFromObj(this.currentForm.form, this.currentForm.schema, frag);
    this.formPageFormEl.innerHTML = "";
    this.formPageFormEl.appendChild(frag);

    // apply folded state to elements
    if (!isCreate) this.applyFoldedStates(this.currentForm.foldedStates);

    // print form to console
    // console.log(this.currentForm);
    // console.log(JSON.stringify(this.currentForm.schema, null, 2));
    // console.log(JSON.stringify(this.currentForm.form, null, 2));

    this.debugDataEl.style.display = this.debugMode ? "inline-block" : "none";
    this.updateFormDebug();
  },


  formPageClick: async function (e) {
    if (e.target.id === "form-back-button") {
      this.goToHomePage();

    } else if (e.target.id === "form-download-button") {
      this.exportZipFile(this.currentForm.name, this.currentForm);

    } else if (e.target.classList.contains("form-add-item-button")) {
      this.formPageAddItem(e.target);

    } else if (e.target.classList.contains("form-delete-item-button")) {
      this.formPageDeleteItem(e.target);

    } else if (e.target.classList.contains("form-toggle-item-button")) {
      e.target.closest(".form-list-item").classList.toggle("folded");
      this.currentForm.foldedStates = this.getFoldedStates();
      this.saveCurrentFormToDb();

    } else if (e.target.classList.contains("form-file-upload-button")) {
      this.formPageUploadFile(e.target);

    } else if (e.target.classList.contains("form-file-open-button")) {
      this.showImageDialog(e.target);

    } else if (e.target.id === "form-page-image-dialog-close-button") {
      this.hideImageDialog();
    }
  },


  formPageInput: function (e) {
    if (e.target.classList.contains("form-input")) {
      const objPath = e.target.name;

      // get value from input
      let value = e.target.value?.trim() || null;
      if (e.target.type === "number") {
        if (e.target.value === "") {
          value = e.target.value = null;
        } else {
          value = +e.target.value;
        }
      }

      this.updateCurrentFormObjectProperty(objPath, value);
    }
  },


  formPageChange: function (e) {
    if (e.target.classList.contains("form-select")) {
      this.updateCurrentFormObjectProperty(e.target.name, e.target.value);
    }
  },


  formPageAddItem: async function (el) {
    const path = el.name;
    const typePath = path.replace(/\.\d+\./gi, ".0.");

    // add to json
    const schemaObj = this.findInObjectByKey(typePath, this.currentForm.schema, true);
    const formObj = this.parseJsonSchema(structuredClone(schemaObj)); // convert type values to null values
    const currentFormObj = this.findInObjectByKey(path, this.currentForm.form);
    currentFormObj.push(formObj);

    // add form elements
    const nameParts = path.split(".");
    const propertyName = this.getFormFormattedHeading(nameParts[nameParts.length - 1]);
    const parentFormListEl = el.closest(".form-list");
    const parentFormListContentEl = parentFormListEl.querySelector(".form-list-content");
    const formListItemIndex = parentFormListContentEl.children.length.toString();
    this.createFormElementsFromObj({ [formListItemIndex]: formObj },
      { "0": schemaObj }, parentFormListContentEl, path, {
      isArray: true,
      name: propertyName,
      element: parentFormListEl
    });

    this.currentForm.foldedStates = this.getFoldedStates();

    await this.saveCurrentFormToDb();

    this.updateFormDebug();
  },


  formPageDeleteItem: async function (el) {
    if (this.confirmDelete && !confirm(this.i18n.deleteFormItemPrompt)) return;

    const path = el.name.substring(0, el.name.lastIndexOf("."));

    // remove from json
    const itemsContainerEl = el.closest(".form-list");
    const formListContentEl = itemsContainerEl.querySelector(".form-list-content");
    const itemEl = el.closest(".form-list-item");
    const itemIndex = Array.from(formListContentEl.children).indexOf(itemEl);
    const formObj = this.findInObjectByKey(path, this.currentForm.form);
    formObj.splice(itemIndex, 1);

    itemEl.remove();

    // update headings
    for (let i = 0; i < formListContentEl.children.length; i++) {
      const labelEl = formListContentEl.children[i].querySelector(".form-list-item-heading > label");
      labelEl.textContent = labelEl.textContent.substring(0, labelEl.textContent.lastIndexOf(" ")) + " " + (i + 1);
    }

    // update form name indexes
    this.updateFormElementNameIndexes(formListContentEl);

    // get list of file names in use
    let fileList = [];
    const formFileUploadLabelEls = this.formPageFormEl.querySelectorAll(".form-file-upload-label");
    formFileUploadLabelEls.forEach(x => fileList.push(x.textContent));
    fileList = Array.from(new Set(fileList));

    // delete unused images
    for (const key in this.currentForm.files) {
      if (!~fileList.indexOf(key)) delete this.currentForm.files[key];
    }

    this.currentForm.foldedStates = this.getFoldedStates();

    await this.saveCurrentFormToDb();

    this.updateFormDebug();
  },


  formPageUploadFile: async function (el) {
    // get file as string
    const file = await this.loadFile();
    if (!file) return;
    const fileString = await this.convertFileToString(file);

    const fileName = file.name;
    const objPath = el.name;
    const filenameLabel = el.nextElementSibling;
    const openFileButton = filenameLabel.nextElementSibling;

    // save form
    await this.saveCurrentFormToDb();

    // update label and show open file button
    filenameLabel.textContent = fileName;
    openFileButton.style.display = "inline-block";

    // update currentForm object
    this.updateCurrentFormObjectProperty(objPath, fileName);
    this.currentForm.files[fileName] = fileString;
  },


  createFormElementsFromObj: function (formObj, schemaObj, parentEl, path, parentInfo) {
    for (let formKey in formObj) {
      const schemaKey = isNaN(+formKey) ? formKey : "0"; // use first item of array from schema obj
      const formValue = formObj[formKey];
      const schemaValue = schemaObj[schemaKey];
      const isSchemaValuePrimitiveArray = this.isPrimitiveArray(schemaValue);
      const currentPath = path ? (`${path}.${formKey}`) : path;
      const nextPath = path ? (`${path}.${formKey}`) : formKey;

      let template = null;
      let nextEl = null;
      let isArray = false;
      let currentPropertyName = null;

      if (!path) path = "";

      // form-list-item-template
      if (parentInfo && parentInfo.isArray) {
        const labelNumber = parentInfo.element.querySelector(".form-list-content").children.length + 1;
        const templateListItemEl = this.getTemplate("form-list-item-template");
        templateListItemEl.querySelector("label").textContent = `${parentInfo.name} ${labelNumber}`;
        templateListItemEl.querySelector(".form-delete-item-button").name = currentPath;
        parentInfo.element.querySelector(".form-list-content").appendChild(templateListItemEl);
        nextEl = templateListItemEl.querySelector(".form-list-item-content");

      // form-list-template
      } else if (Array.isArray(schemaValue) && !isSchemaValuePrimitiveArray) {
        isArray = true;
        currentPropertyName = this.getFormFormattedHeading(formKey);
        template = this.getTemplate("form-list-template");
        template.querySelector("label").textContent = currentPropertyName;
        template.querySelector(".form-add-item-button").name = nextPath;

      // form-heading-template
      } else if (typeof schemaValue === "object" && !isSchemaValuePrimitiveArray) {
        if (isNaN(+formKey)) {
          template = this.getTemplate("form-heading-template");
          template.querySelector("label").textContent = this.getFormFormattedHeading(formKey);
        }

      // text-input-template
      } else if (schemaValue === "%string%") {
        template = this.getTemplate("text-input-template");
        template.querySelector("label").textContent = formKey;
        const inputEl = template.querySelector("input");
        inputEl.name = currentPath;
        inputEl.value = formValue;

        // zip code uses a different kind of autocomplete to disable autofill properly
        if (formKey.match(/zip|post ?code/i)) inputEl.setAttribute("autocomplete", "no");

      // number-input-template
      } else if (schemaValue === "%number%") {
        template = this.getTemplate("number-input-template");
        template.querySelector("label").textContent = formKey;
        const inputEl = template.querySelector("input");
        inputEl.name = currentPath;
        inputEl.value = (formValue !== null && formValue !== undefined) ? +formValue : "";

      // file-upload-template
      } else if (schemaValue === "%file%") {
        template = this.getTemplate("file-upload-template");
        const buttonEl = template.querySelector(".form-file-upload-button");
        buttonEl.name = currentPath;
        buttonEl.previousElementSibling.textContent = formKey.replace("_file", "");
        buttonEl.nextElementSibling.textContent = formValue || this.i18n.selectFileButtonLabel;
        buttonEl.nextElementSibling.nextElementSibling.style.display = formValue ? "inline-block" : "none";

      // dropdown-template
      } else if (isSchemaValuePrimitiveArray) {
        template = this.getTemplate("dropdown-template");
        template.querySelector("label").textContent = formKey;
        const select = template.querySelector("select");
        select.name = currentPath;
        const options = schemaValue.map(x => `<option value="${x}">${x}</option>`).join("\n");
        select.insertAdjacentHTML("afterbegin", options);
        select.value = formValue;
      }

      if (template) parentEl.appendChild(template);

      // go to next item
      if (!isSchemaValuePrimitiveArray && (Array.isArray(schemaValue) || typeof schemaValue === "object")) {
        this.createFormElementsFromObj(formValue, schemaValue, nextEl || parentEl, nextPath, {
          isArray: isArray,
          name: currentPropertyName,
          element: template
        });
      }
    }
  },


  getFormFormattedHeading: function (text) {
    return (text.charAt(0).toUpperCase() + text.slice(1)).replace(/_/g, " ");
  },


  updateCurrentFormObjectProperty: async function (objPath, value) {
    // This updates the value of a single property of the forms json object
    // it updates a property like this
    // locations.0.air sample.yeast_fungi.2.species
    // not like this
    // locations.0.air sample.yeast_fungi.2
    const path = objPath.substring(0, objPath.lastIndexOf("."));
    const prop = objPath.substring(objPath.lastIndexOf(".") + 1);
    const obj = this.findInObjectByKey(path, this.currentForm.form);
    obj[prop] = value;
    await this.saveCurrentFormToDb();
    this.updateFormDebug();
  },


  getFoldedStates: function () {
    const foldedStates = [];
    this.formPageFormEl.querySelectorAll(".form-list-item").forEach(x => {
      foldedStates.push(x.classList.contains("folded") ? 1 : 0);
    });
    return foldedStates;
  },


  applyFoldedStates: function (foldedStates) {
    if (!foldedStates) return;
    this.formPageFormEl.querySelectorAll(".form-list-item").forEach((x, i) => {
      if (foldedStates[i]) x.classList.add("folded");
    });
  },


  updateFormElementNameIndexes: function (rootEl) {
    // this recursively updates various html name attributes that are used to identify
    // which html element is related to which json property.  So when an element is
    // deleted a html name attribute might go from locations.1.air sample.yeast_fungi.2, to
    // locations.0.air sample.yeast_fungi.2, if the first locations array item was deleted.
    // Check the name attributes of say the Delete buttons on the forms page in the
    // browser devtools if it's not clear, you should see a name attribute similar to
    // locations.0.air sample.yeast_fungi.2, depending on the current jsonSchema value
    Array.from(rootEl.children).forEach(el => {
      if (el.name) {
        const indexes = [];

        // count how many list items deep the current item is and add to indexes array
        let count = 0;
        let parentFormListItem = el.closest(".form-list-item");
        let parentFormListContent = el.closest(".form-list-content");
        while (parentFormListContent) {
          if (parentFormListContent) {
            indexes.push(Array.from(parentFormListContent.children).indexOf(parentFormListItem));
          }

          parentFormListItem = parentFormListContent.parentElement.closest(".form-list-item");
          parentFormListContent = parentFormListContent.parentElement.closest(".form-list-content");
          count++;
          if (count > 100) { // artificial count to detect infinite loop if it ever happens
            alert("Error updating element name indexes");
            throw "Infinite loop in updateFormElementNameIndexes";
          }
        }

        // update the indexes in the elements name, e.g. the numbers 1 and 2 here
        // in this example: locations.1.air sample.yeast_fungi.2
        if (indexes.length) {
          indexes.reverse();
          let newName = [];
          let nameCount = 0;
          el.name.split(".").forEach((x, i) => {
            if (isNaN(+x)) {
              newName.push(x);
            } else {
              newName.push(indexes[nameCount++]);
            }
          });

          el.name = newName.join(".");
        }
      }

      if (el.children) {
        this.updateFormElementNameIndexes(el);
      }
    });
  },


  showImageDialog: function (el) {
    // shows the selected image in a popup dialog
    const imageName = el.previousElementSibling.textContent;
    const imgContent = this.currentForm.files[imageName];
    this.formPageImageDialogImageEl.src = imgContent;
    this.formPageImageDialogEl.style.display = "block";
  },


  hideImageDialog: function () {
    this.formPageImageDialogImageEl.src = "";
    this.formPageImageDialogEl.style.display = "none";
  },


  //#endregion




  //#region Database


  saveCurrentFormToDb: async function () {
    await this.saveToDb(this.currentForm.name, this.currentForm);
  },


  loadKeysFromDb: async function () {
    return await idbKeyval.keys();
  },


  loadFromDb: async function (key) {
    return await idbKeyval.get(key);
  },


  saveToDb: function (key, data) {
    return new Promise(resolve => {
      if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(async () => {
        await idbKeyval.set(key, data);
        resolve();
      }, 1000);
    });
  },


  deleteFromDb: async function (key) {
    return await idbKeyval.del(key);
  },


  //#endregion




  //#region Files


  importZipFile: async function () {
    // load file
    const file = await this.loadFile(".zip");
    if (!file) return false;

    // get files in zip file.  Example:
    // https://github.com/gildas-lormeau/zip.js/blob/2df1c48acff9ee87ee9d8dce0fe738103ca84796/tests/all/test-parallel-reads.js#L21
    const zipReader = new zip.ZipReader(new zip.BlobReader(file));
    const entries = await zipReader.getEntries();

    // data from zip file is loaded into this object
    const loadedForm = this.getEmptyFormObject();

    // load individual files from zip file
    await Promise.all(entries.map(async entry => {
      const parts = entry.filename.split("/");
      const fileName =  parts[parts.length - 1];
      const mimeType = this.getMimeType(fileName);

      // form
      if (fileName === "form.json") {
        loadedForm.form = JSON.parse(await entry.getData(new zip.TextWriter(mimeType)));

      // metadata
      } else if (fileName === "metadata.json") {
        const metadata = JSON.parse(await entry.getData(new zip.TextWriter(mimeType)));
        loadedForm.schema = metadata.schema;
        loadedForm.created = metadata.created;
        loadedForm.name = metadata.name;
        loadedForm.foldedStates = metadata.foldedStates;

      // images and other files
      } else {
        loadedForm.files[fileName] = await entry.getData(new zip.Data64URIWriter(mimeType));
      }
    }));

    await zipReader.close();

    // check if a form with the same name already exists
    const existingFormNames = await this.loadKeysFromDb();
    if (~existingFormNames.indexOf(loadedForm.name)) {
      if (!confirm(this.i18n.overwriteExistingForm.replace("${}", loadedForm.name))) return;
    }

    // save form to database
    await this.saveToDb(loadedForm.name, loadedForm);

    return true;
  },


  exportZipFile: async function (fileName, formObj) {
    // get form from db
    if (!formObj) {
      formObj = await this.loadFromDb(fileName);
    }

    // zip file
    const name = formObj.name;
    const zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));
    await Promise.all([
      // add form
      zipWriter.add(name + "/form.json", new zip.TextReader(JSON.stringify(formObj.form, null, 2))),

      // add schema, name and created time to a single file
      zipWriter.add(name + "/metadata.json", new zip.TextReader(JSON.stringify({
        name: name,
        created: formObj.created,
        schema: formObj.schema,
        foldedStates: formObj.foldedStates
      }, null, 2))),

      // images and other files
      ...Object.entries(formObj.files).map(([key, value]) =>
        zipWriter.add(name + "/" + key, new zip.Data64URIReader(value)))
    ]);

    const zipFile = await zipWriter.close();

    // save file
    this.saveFile(fileName + ".zip", zipFile);
  },


  loadFile: function (fileType) {
    // load a file from disk
    return new Promise(resolve => {
      // remove any existing temporary hidden file inputs.  They might get
      // orphaned if user cancels file select dialog so this cleans them up
      const existing = document.querySelectorAll(".temporary-hidden-file-input");
      Array.from(existing).forEach(x => x.remove());

      // ask user to choose file
      // this creates a temporary file type input
      const input = document.createElement("input");
      input.type = "file";
      input.classList.add("temporary-hidden-file-input");
      if (fileType) input.accept = fileType;
      input.style.display = "none";
      document.body.appendChild(input);

      input.addEventListener("change", async () => {
        // check file was selected
        if (!input.files || !input.files.length) {
          input.remove();
          return resolve();
        }

        // check file has valid extension
        const fileName = input.files[0].name;
        if (fileType) {
          if (!fileName.endsWith(fileType)) {
            input.remove();
            alert(this.i18n.importFileTypeError.replace("${}", fileType));
            return resolve();
          }
        }

        input.remove();
        return resolve(input.files[0]);
      });

      input.click();
    });
  },


  saveFile: function (fileName, file) {
    // save a file to disk
    // this creates a temporary anchor element
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    const url = window.URL.createObjectURL(file);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  },


  convertFileToString: function (file) {
    // read a file into a base64 string
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.addEventListener("load", async () => {
        resolve(reader.result);
      });
      reader.readAsDataURL(file);
    });
  },


  getMimeType: function (fileName) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    if (fileName.endsWith(".jpg")) {
      return "image/jpeg";
    } else if (fileName.endsWith(".jpeg")) {
      return "image/jpeg";
    } else if (fileName.endsWith(".png")) {
      return "image/png";
    } else if (fileName.endsWith(".bmp")) {
      return "image/bmp";
    } else if (fileName.endsWith(".webp")) {
      return "image/webp";
    } else if (fileName.endsWith(".gif")) {
      return "image/gif";
    } else if (fileName.endsWith(".heic")) {
      return "image/heic";
    } else if (fileName.endsWith(".json")) {
      return "application/json";
    } else {
      return "application/octet-stream";
    }
  },


  //#endregion




  //#region Other


  getEmptyFormObject() {
    // returns a new form object
    return {
      name: "",
      created: "",
      schema: {},
      form: {},
      files: {},
      foldedStates: []
    };
  },


  getNewFormObject: function (formName) {
    // returns a default new form object
    const formObj = this.getEmptyFormObject();
    formObj.name = formName;
    formObj.created = this.getFormattedDateTime();
    formObj.schema = this.parseJsonSchema(structuredClone(this.getJsonSchema()), true);
    formObj.form = this.parseJsonSchema(structuredClone(this.getJsonSchema()));
    formObj.foldedStates = [];
    return formObj;
  },


  parseJsonSchema: function (jsonObj, setTypes) {
    // Parses user provided json schema into an object with property values replaced
    // with type names or null values. The output with types is the schema, the output
    // with null values is an empty form object for when the user creates a form

    for (let key in jsonObj) {
      if (!key) continue;
      const value = jsonObj[key];
      const isValueAPrimitiveArray = this.isPrimitiveArray(value);

      if (Array.isArray(value)) {
        if (isValueAPrimitiveArray && !setTypes) {
          jsonObj[key] = value[0];

        } else if (!isValueAPrimitiveArray && setTypes) {
          // remove additional array items so there's only 1, only for type schema.
          // When new form itmes are added, only one schema item is required to copy from
          jsonObj[key] = value.slice(0, 1);
        }

      // string type (might be a file type too if using a file keyword)
      } else if (typeof value === "string") {
        if (key === "image" || key === "file" || key.endsWith("_file")) {
          jsonObj[key] = setTypes ? "%file%" : null;
        } else {
          jsonObj[key] = setTypes ? "%string%" : null;
        }

      // number type
      } else if (typeof value === "number") {
        jsonObj[key] = setTypes ? "%number%" : null;
      }

      if (!isValueAPrimitiveArray && (Array.isArray(value) || typeof value === "object")) {
        this.parseJsonSchema(value, setTypes);
      }
    }

    return jsonObj;
  },


  findInObjectByKey: function (path, objToSearch, isArrayResult) {
    // "path" here is the value of the name attribute from one of the html
    // elements, for example: locations.0.air sample.yeast_fungi.2.species
    const pathParts = path.split(".");

    function objFindByKey(parts, obj) {
      const next = parts.shift();
      if (parts.length) {
        return objFindByKey(parts, obj[next]);
      } else {
        return obj[next];
      }
    }

    const result = objFindByKey(pathParts, objToSearch);
    return isArrayResult ? result[0] : result;
  },


  getTemplate: function (name) {
    // Returns a template from the html as an element
    const templateEl = document.getElementById(name);
    return templateEl.content.firstElementChild.cloneNode(true);
  },


  isPrimitiveArray: function (arr) {
    // returns true if the array is a primitive array and not an array of objects or arrays
    return Array.isArray(arr) && arr.length &&
      !Array.isArray(arr[0]) && typeof arr[0] !== "object";
  },


  padLeft0: function (val, width = 2) {
    return ("0" + val).slice(width * -1);
  },


  getFormattedDateTime: function () {
    const d = new Date();
    const hours = this.padLeft0(d.getHours());
    const mins = this.padLeft0(d.getMinutes());
    const secs = this.padLeft0(d.getSeconds());
    const day = this.padLeft0(d.getDate());
    const month = this.padLeft0(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${hours}:${mins}:${secs} ${day}-${month}-${year}`;
  },


  //#endregion




  //#region Debug


  goToDebugPage: function () {
    this.homePageEl.style.display = "none";
    this.formPageEl.style.display = "none";
    this.debugPageEl.style.display = "block";
    this.debugDataEl.style.display = "none";
  },


  debugPageClick: async function (e) {
    if (e.target.id === "debug-back-button") {
      this.goToHomePage();

    // add test items
    } else if (e.target.id === "debug-create-home-test-items") {
      const items = [];
      for (let i = 0; i < 20; i++) {
        const formName = "debug-item-" + this.padLeft0(i + 1);
        items.push([formName, this.getNewFormObject(formName)]);
      }
      await idbKeyval.setMany(items);

    // delete test items
    } else if (e.target.id === "debug-delete-home-test-items") {
      const items = [];
      for (let i = 0; i < 20; i++) {
        const formName = "debug-item-" + this.padLeft0(i + 1);
        items.push(formName);
      }
      await idbKeyval.delMany(items);
    }
  },


  updateFormDebug: function () {
    this.debugDataEl.textContent = JSON.stringify(this.currentForm.form, null, 2);
  },


  //#endregion


}


window.addEventListener("load", () => {
  app.init();
});

