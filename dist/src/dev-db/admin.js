"use strict";
document.addEventListener("DOMContentLoaded", async () => {
    const DATA_SOURCE = "dev";
    const paginationNextBtn = document.querySelector("[dev-target=next-btn]");
    const paginationPreviousBtn = document.querySelector("[dev-target=previous-btn]");
    const statusTab = document.querySelector("[dev-target=status-tab]");
    const editTab = document.querySelector("[dev-target=edit-tab]");
    const moveToLiveBtn = document.querySelector("[dev-target=move-to-live]");
    const deleteRejectedBtn = document.querySelector("[dev-target=delete-rejected]");
    const editTableNameInput = document.querySelector("[dev-target=edit-table-name]");
    const editInsightNameInput = document.querySelector("[dev-target=edit-insight-name]");
    const insightSortInput = document.querySelector("[dev-target=status-sort]");
    const adminTableBody = document.querySelector("[dev-target=table-body]");
    const adminTableRowTemplate = document.querySelector("[dev-target=table-row-template]");
    const adminEditTabActions = document.querySelector(`[dev-target=admin-edit-tab-actions]`);
    const adminEditTabApprove = adminEditTabActions.querySelector(`[dev-target=admin-edit-approve]`);
    const adminEditTabMoveToLive = adminEditTabActions.querySelector(`[dev-target=edit-tab-move-to-live]`);
    const adminEditTabReject = adminEditTabActions.querySelector(`[dev-target=admin-edit-reject]`);
    const adminEditTabDeleteReject = adminEditTabActions.querySelector(`[dev-target=admin-edit-delete-rejected-insight]`);
    const editTableName = new Choices(editTableNameInput, {
        searchResultLimit: 20,
    });
    const editInsightName = new Choices(editInsightNameInput, {
        searchResultLimit: 20,
    });
    const insightSort = new Choices(insightSortInput, {
        searchResultLimit: 20,
    });
    let currentInsight = null;
    let currentPage = 1;
    let perPage = 100;
    let insightSortStatus = "";
    let editTableNameValue = "editor_insights";
    const { companiesMentioned, company, companyType, curatedInput, descriptionInput, event, insightClassification, insightDetails, nameInput, idInput, people, publishedInput, slugInput, sourceAuthorInput, sourceCategory, sourceDocuments, sourceInput, sourcePublicationInput, sourceUrlInput, technologyCategory, internalNoteInput, form: insightForm, } = initForm();
    sourceDocuments.passedElement.element.addEventListener("addItem", (event) => {
        console.log({ values: sourceDocuments.getValue() });
        const sourceDocumentPublishedDate = sourceDocuments.getValue()[0]?.customProperties?.publication_date;
        if (sourceDocumentPublishedDate) {
            const [year, month, day] = sourceDocumentPublishedDate.split("-");
            sourcePublicationInput.parentElement
                ?.querySelectorAll("input")
                .forEach((input) => {
                input.value = `${month}-${day}-${year}`;
            });
        }
        else {
            sourcePublicationInput.parentElement
                ?.querySelectorAll("input")
                .forEach((input) => {
                input.value = "";
            });
        }
    }, false);
    getEditorInsights(currentPage, perPage, insightSortStatus);
    initAdminEditTabActions();
    fetchDataFromEndpoint("", editInsightName, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/get_insights", editTableNameValue);
    deleteRejectedBtn?.addEventListener("click", () => {
        deleteAllRejectedInsights();
    });
    moveToLiveBtn?.addEventListener("click", () => {
        moveApprovedToLive();
    });
    insightSort.passedElement.element.addEventListener("choice", async (event) => {
        insightSortStatus = event.detail.choice.value;
        const { items } = await getEditorInsights(currentPage, perPage, insightSortStatus);
        if (insightSortStatus === "Approved" && items.length > 0) {
            moveToLiveBtn?.setAttribute("dev-display", "flex");
            deleteRejectedBtn?.setAttribute("dev-display", "none");
        }
        else if (insightSortStatus === "Rejected" && items.length > 0) {
            deleteRejectedBtn?.setAttribute("dev-display", "flex");
            moveToLiveBtn?.setAttribute("dev-display", "none");
        }
        else {
            deleteRejectedBtn?.setAttribute("dev-display", "none");
            moveToLiveBtn?.setAttribute("dev-display", "none");
        }
    }, false);
    editTableName.passedElement.element.addEventListener("choice", (event) => {
        adminEditTabActions.setAttribute("dev-display", "none");
        editTableNameValue = event.detail.choice.value;
        fetchDataFromEndpoint("", editInsightName, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/get_insights", editTableNameValue);
        clearForm();
    }, false);
    editInsightName.passedElement.element.addEventListener("search", (event) => {
        debouncedFetch(event.detail.value, editInsightName, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/get_insights", editTableNameValue);
    }, false);
    editInsightName.passedElement.element.addEventListener("choice", (event) => {
        addDataToForm(event.detail.choice.customProperties);
        updateAdminEditTabActionsStates(event.detail.choice.customProperties);
    }, false);
    insightForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (slugInput.classList.contains("is-error")) {
            Toastify({
                text: "Slug Already in use",
                duration: 3000,
                destination: "https://github.com/apvarun/toastify-js",
                newWindow: true,
                close: true,
                gravity: "top",
                position: "left",
                stopOnFocus: true,
                style: {
                    background: "linear-gradient(to right, #ff5f6d, #ffc371)",
                },
                onClick: function () { }, // Callback after click
            }).showToast();
        }
        else {
            const transformedData = await getFormData();
            console.log("transformedData", transformedData);
            console.log("editTableNameValue", editTableNameValue);
            fetch(`https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/update_insight?table_name=${editTableNameValue}&x-data-source=${DATA_SOURCE}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    data: transformedData,
                }),
            })
                .then((res) => res.json())
                .then((dataRes) => {
                console.log("dataRes", dataRes);
                Toastify({
                    text: "Submitted",
                    duration: 3000,
                    destination: "https://github.com/apvarun/toastify-js",
                    newWindow: true,
                    close: true,
                    gravity: "top",
                    position: "left",
                    stopOnFocus: true,
                    style: {
                        background: "linear-gradient(to right, #00b09b, #96c93d)",
                    },
                    onClick: function () { }, // Callback after click
                }).showToast();
                clearForm();
                // refetch editor table
                getEditorInsights(currentPage, perPage, insightSortStatus);
            })
                .catch((err) => console.log("err", err));
        }
    });
    function displayRowsOnTable(data, rowTemplate) {
        if (adminTableBody)
            adminTableBody.innerHTML = "";
        data.items.forEach((insight) => {
            const row = rowTemplate.cloneNode(true);
            const name = row.querySelector("[dev-target=name]");
            const status = row.querySelector("[dev-target=status]");
            const createdOn = row.querySelector("[dev-target=created-on]");
            const company = row.querySelector("[dev-target=company]");
            const sourceListWrap = row.querySelector("[dev-target=source-list]");
            const sourceListItem = row.querySelector("[dev-target=source-list-item]");
            const approve = row.querySelector("[dev-target=approve]");
            const reject = row.querySelector("[dev-target=reject]");
            const edit = row.querySelector("[dev-target=edit]");
            const deleteRejectedInsight = row.querySelector("[dev-target=delete-rejected-insight]");
            const createdOnDate = new Date(insight.created_at);
            deleteRejectedInsight.style.display = "none";
            if (name)
                name.textContent = insight.name;
            if (createdOn)
                createdOn.textContent = `${String(createdOnDate.getMonth() + 1).padStart(2, "0")}-${String(createdOnDate.getDate()).padStart(2, "0")}-${createdOnDate.getFullYear()}`;
            if (status)
                status.textContent = insight.status;
            if (company)
                company.textContent = insight._company
                    ? `${insight._company?.name}(${insight._company?.id})`
                    : "";
            if (sourceListWrap) {
                sourceListWrap.innerHTML = "";
                insight.source_category_id.forEach(({ name, id }) => {
                    const item = sourceListItem?.cloneNode(true);
                    item.textContent = `${name}(${id})`;
                    sourceListWrap.appendChild(item);
                });
            }
            if (insight.status === "Approved") {
                approve.textContent = "Approved";
                approve.classList.add("btn-disabled");
            }
            else if (insight.status === "Rejected") {
                reject.textContent = "Rejected";
                reject.classList.add("btn-disabled");
                deleteRejectedInsight.style.display = "flex";
            }
            approve?.addEventListener("click", () => {
                adminAction("approve", insight.id)
                    .then(() => {
                    insight.status = "Approved";
                    approve.textContent = "Approved";
                    approve.classList.add("btn-disabled");
                    reject.textContent = "Reject";
                    reject.classList.remove("btn-disabled");
                    status.textContent = "Approved";
                    deleteRejectedInsight.style.display = "none";
                    clearForm();
                })
                    .catch((err) => console.log("error"));
            });
            reject?.addEventListener("click", () => {
                adminAction("reject", insight.id)
                    .then(() => {
                    insight.status = "Rejected";
                    reject.textContent = "Rejected";
                    reject.classList.add("btn-disabled");
                    approve.textContent = "Approve";
                    approve.classList.remove("btn-disabled");
                    status.textContent = "Rejected";
                    deleteRejectedInsight.style.display = "flex";
                    clearForm();
                })
                    .catch((err) => console.log("error"));
            });
            name?.addEventListener("click", () => {
                localStorage.setItem("editor_insight_richtext", JSON.stringify(insight["insight-detail"]));
            });
            deleteRejectedInsight?.addEventListener("click", () => {
                adminAction("delete", insight.id)
                    .then(() => {
                    deleteRejectedInsight.textContent = "Deleted";
                    deleteRejectedInsight.classList.add("btn-disabled");
                    approve.classList.add("btn-disabled");
                    reject.classList.add("btn-disabled");
                    edit.classList.add("btn-disabled");
                    status.textContent = "Deleted";
                })
                    .catch((err) => console.log("error"));
            });
            edit?.addEventListener("click", () => {
                addDataToForm(insight);
                editTableNameValue = "editor_insights";
                updateAdminEditTabActionsStates(insight);
                editTab?.click();
                console.log("edit");
                resetTableAndSearchInsightValue();
            });
            adminTableBody?.appendChild(row);
        });
    }
    async function getEditorInsights(page, perPage, status) {
        const res = await fetch(`https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/get_editor_insights?x-data-source=${DATA_SOURCE}&page=${page}&per_page=${perPage}&status=${status}`);
        const data = (await res.json());
        paginationNextBtn?.classList[data.nextPage ? "remove" : "add"]("btn-disabled");
        paginationPreviousBtn?.classList[data.prevPage ? "remove" : "add"]("btn-disabled");
        currentPage = data.curPage;
        adminTableRowTemplate && displayRowsOnTable(data, adminTableRowTemplate);
        return data;
    }
    paginationPreviousBtn?.addEventListener("click", () => {
        getEditorInsights(currentPage - 1, perPage, insightSortStatus);
    });
    paginationNextBtn?.addEventListener("click", () => {
        getEditorInsights(currentPage + 1, perPage, insightSortStatus);
    });
    function initForm() {
        const form = document.querySelector("[dev-target=form]");
        const idInput = form.querySelector("[dev-target=id-input]");
        const nameInput = form.querySelector("[dev-target=name-input]");
        const slugInput = form.querySelector("[dev-target=slug-input]");
        const companyInput = form.querySelector("[dev-target=company]");
        const descriptionInput = form.querySelector("[dev-target=description-input]");
        const internalNoteInput = form.querySelector("[dev-target=internal-note]");
        const insightDetailsInput = form.querySelector("[dev-target=insight-details]");
        const insightDetailsHeightToggle = form.querySelector("[dev-target=rich-text-height-toggle]");
        const curatedInput = form.querySelector("[dev-target=curated-input]");
        const sourceInput = form.querySelector("[dev-target=source-input]");
        const sourceAuthorInput = form.querySelector("[dev-target=source-author-input]");
        const sourceUrlInput = form.querySelector("[dev-target=source-url-input]");
        const sourcePublicationInput = form.querySelector("[dev-target=source-publication-input]");
        const sourceCategoryInput = form.querySelector("[dev-target=source-category]");
        const companyTypeInput = form.querySelector("[dev-target=company-type]");
        const insightClassificationInput = form.querySelector("[dev-target=insight-classification]");
        const technologyCategoryInput = form.querySelector("[dev-target=technology-category]");
        const companiesMentionedInput = form.querySelector("[dev-target=companies-mentioned]");
        const peopleInput = form.querySelector("[dev-target=people]");
        const sourceDocumentsInput = form.querySelector("[dev-target=source-documents]");
        const eventInput = form.querySelector("[dev-target=event]");
        const publishedInput = form.querySelector("[dev-target=published-input]");
        flatpickr(curatedInput, {
            dateFormat: "m-d-Y",
            altFormat: "m-d-Y",
            altInput: true,
        });
        flatpickr(sourcePublicationInput, {
            dateFormat: "m-d-Y",
            altFormat: "m-d-Y",
            altInput: true,
        });
        const company = new Choices(companyInput, { searchResultLimit: 20 });
        const event = new Choices(eventInput, { searchResultLimit: 20 });
        const sourceCategory = new Choices(sourceCategoryInput, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            searchResultLimit: 20,
        });
        const companyType = new Choices(companyTypeInput, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            searchResultLimit: 20,
        });
        const insightClassification = new Choices(insightClassificationInput, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            searchResultLimit: 20,
        });
        const technologyCategory = new Choices(technologyCategoryInput, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            searchResultLimit: 20,
        });
        const companiesMentioned = new Choices(companiesMentionedInput, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            searchResultLimit: 20,
        });
        const people = new Choices(peopleInput, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            searchResultLimit: 20,
        });
        const sourceDocuments = new Choices(sourceDocumentsInput, {
            removeItemButton: true,
            duplicateItemsAllowed: false,
            searchResultLimit: 20,
        });
        const insightDetails = ClassicEditor.create(insightDetailsInput, {
            extraPlugins: [MyCustomUploadAdapterPlugin],
        });
        insightDetailsHeightToggle.addEventListener("change", () => {
            const checked = insightDetailsHeightToggle.checked;
            const insightDetailContent = document.querySelector(".ck.ck-editor__main");
            insightDetailContent.style.overflow = "auto";
            insightDetailContent.style.maxHeight = checked ? "20vh" : "none";
        });
        insightDetails.then((value) => {
            value.model.document.on("change:data", () => {
                const data = value.getData();
                localStorage.setItem("editor_insight_richtext", JSON.stringify(data));
            });
        });
        nameInput.addEventListener("input", () => {
            slugInput.value = slugify(nameInput.value);
            slugInput.dispatchEvent(new Event("input"));
        });
        slugInput.addEventListener("input", () => {
            console.log("logging");
            const currentInsightSlug = localStorage.getItem("current-insight-slug");
            if (currentInsightSlug) {
                currentInsightSlug !== slugInput.value &&
                    debounceSlugCheck(slugInput.value);
            }
        });
        fetchChoicesOnKeystroke(company, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "company");
        fetchChoicesOnKeystroke(companiesMentioned, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "company");
        fetchChoicesOnKeystroke(companyType, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "company-type");
        fetchChoicesOnKeystroke(technologyCategory, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "technology-category");
        fetchChoicesOnKeystroke(sourceDocuments, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "source-documents");
        fetchChoicesOnKeystroke(insightClassification, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "insight-classification");
        fetchChoicesOnKeystroke(sourceCategory, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "source-category");
        fetchChoicesOnKeystroke(event, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "event");
        fetchChoicesOnKeystroke(people, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search", "people");
        return {
            idInput,
            nameInput,
            slugInput,
            company,
            descriptionInput,
            insightDetails,
            curatedInput,
            sourceInput,
            sourceAuthorInput,
            sourceUrlInput,
            sourcePublicationInput,
            sourceCategory,
            companyType,
            insightClassification,
            technologyCategory,
            companiesMentioned,
            people,
            sourceDocuments,
            event,
            publishedInput,
            internalNoteInput,
            form,
        };
    }
    function addDataToForm(insight) {
        clearForm();
        localStorage.setItem("current-insight-slug", insight.slug);
        idInput.value = insight.id.toString();
        nameInput.value = insight.name;
        slugInput.value = insight.slug;
        internalNoteInput.value = insight.internal_note;
        insight._company &&
            company.setValue([
                {
                    value: insight._company.id,
                    label: insight._company.name,
                },
            ]);
        descriptionInput.value = insight.description;
        insightDetails.then((value) => {
            value.setData(insight["insight-detail"]);
        });
        curatedInput.parentElement?.querySelectorAll("input").forEach((input) => {
            if (insight.curated) {
                const [year, month, day] = insight.curated.split("-");
                input.value = `${month}-${day}-${year}`;
            }
            else {
                input.value = "";
            }
        });
        sourceInput.value = insight.source;
        sourceAuthorInput.value = insight.source_author;
        sourceUrlInput.value = insight["source-url"];
        sourcePublicationInput.parentElement
            ?.querySelectorAll("input")
            .forEach((input) => {
            if (insight["source-publication-date"]) {
                const [year, month, day] = insight["source-publication-date"].split("-");
                input.value = `${month}-${day}-${year}`;
            }
            else {
                input.value = "";
            }
        });
        sourceCategory.setValue(insight.source_category_id.map(({ id, name }) => ({
            label: name,
            value: id,
        })));
        companyType.setValue(insight.company_type_id.map(({ id, name }) => ({
            label: name,
            value: id,
        })));
        insightClassification.setValue(insight.insight_classification_id.map(({ id, name }) => ({
            label: name,
            value: id,
        })));
        technologyCategory.setValue(insight.technology_category_id.map(({ id, name }) => ({
            label: name,
            value: id,
        })));
        companiesMentioned.setValue(insight.companies_mentioned.map(({ id, name }) => ({
            label: name,
            value: id,
        })));
        people.setValue(insight.people_id.map(({ id, name }) => ({
            label: name,
            value: id,
        })));
        sourceDocuments.setValue(insight.source_document_id.map(({ id, name }) => ({
            label: name,
            value: id,
        })));
        insight._event &&
            event.setValue([
                { label: insight._event.name, value: insight._event.id },
            ]);
        choicesDropdownInit();
        publishedInput.checked = insight.published;
        publishedInput.parentElement
            ?.querySelector(".w-checkbox-input")
            ?.classList[insight.published ? "add" : "remove"]("w--redirected-checked");
    }
    function updateAdminEditTabActionsStates(insight) {
        currentInsight = insight;
        adminEditTabActions.setAttribute("dev-display", editTableNameValue === "editor_insights" ? "flex" : "none");
        if (insight.status === "Pending") {
            adminEditTabApprove.textContent = "Approve";
            adminEditTabApprove.classList.remove("btn-disabled");
            adminEditTabReject.textContent = "Reject";
            adminEditTabReject.classList.remove("btn-disabled");
            adminEditTabMoveToLive.setAttribute("dev-display", "none");
            adminEditTabDeleteReject.setAttribute("dev-display", "none");
        }
        if (insight.status === "Approved") {
            adminEditTabApprove.textContent = "Approved";
            adminEditTabApprove.classList.add("btn-disabled");
            adminEditTabReject.textContent = "Reject";
            adminEditTabReject.classList.remove("btn-disabled");
            adminEditTabMoveToLive.setAttribute("dev-display", "flex");
            adminEditTabDeleteReject.setAttribute("dev-display", "none");
        }
        if (insight.status === "Rejected") {
            adminEditTabApprove.textContent = "Approve";
            adminEditTabApprove.classList.remove("btn-disabled");
            adminEditTabReject.textContent = "Rejected";
            adminEditTabReject.classList.add("btn-disabled");
            adminEditTabMoveToLive.setAttribute("dev-display", "none");
            adminEditTabDeleteReject.setAttribute("dev-display", "flex");
        }
    }
    function initAdminEditTabActions() {
        adminEditTabApprove.addEventListener("click", () => {
            if (currentInsight && editTableNameValue === "editor_insights") {
                currentInsight;
                adminAction("approve", currentInsight.id)
                    .then(() => {
                    adminEditTabApprove.textContent = "Approved";
                    adminEditTabApprove.classList.add("btn-disabled");
                    adminEditTabReject.textContent = "Reject";
                    adminEditTabReject.classList.remove("btn-disabled");
                    adminEditTabMoveToLive.setAttribute("dev-display", "flex");
                    adminEditTabDeleteReject.setAttribute("dev-display", "none");
                    getEditorInsights(currentPage, perPage, insightSortStatus);
                })
                    .catch((err) => console.log("error"));
            }
        });
        adminEditTabReject.addEventListener("click", () => {
            if (currentInsight && editTableNameValue === "editor_insights") {
                adminAction("reject", currentInsight.id)
                    .then(() => {
                    adminEditTabApprove.textContent = "Approve";
                    adminEditTabApprove.classList.remove("btn-disabled");
                    adminEditTabReject.textContent = "Rejected";
                    adminEditTabReject.classList.add("btn-disabled");
                    adminEditTabMoveToLive.setAttribute("dev-display", "none");
                    adminEditTabDeleteReject.setAttribute("dev-display", "flex");
                    getEditorInsights(currentPage, perPage, insightSortStatus);
                })
                    .catch((err) => console.log("error"));
            }
        });
        adminEditTabDeleteReject.addEventListener("click", () => {
            if (currentInsight && editTableNameValue === "editor_insights") {
                adminAction("delete", currentInsight.id)
                    .then(() => {
                    Toastify({
                        text: "Deleted Insight",
                        duration: 3000,
                        destination: "https://github.com/apvarun/toastify-js",
                        newWindow: true,
                        close: true,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: true,
                        style: {
                            background: "linear-gradient(to right, #00b09b, #96c93d)",
                        },
                        onClick: function () { }, // Callback after click
                    }).showToast();
                    clearForm();
                    getEditorInsights(currentPage, perPage, insightSortStatus);
                })
                    .catch((err) => console.log("error"));
            }
        });
        adminEditTabMoveToLive.addEventListener("click", () => {
            if (currentInsight && editTableNameValue === "editor_insights") {
                adminAction("move-to-live", currentInsight.id)
                    .then((movedData) => {
                    console.log({ movedData });
                    Toastify({
                        text: "Moved to live",
                        duration: 3000,
                        destination: "https://github.com/apvarun/toastify-js",
                        newWindow: true,
                        close: true,
                        gravity: "top",
                        position: "left",
                        stopOnFocus: true,
                        style: {
                            background: "linear-gradient(to right, #00b09b, #96c93d)",
                        },
                        onClick: function () { }, // Callback after click
                    }).showToast();
                    clearForm();
                    getEditorInsights(currentPage, perPage, insightSortStatus);
                })
                    .catch((err) => console.log("error"));
            }
        });
    }
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }
    function clearSelections(choicesInstance) {
        choicesInstance.removeActiveItems();
    }
    function clearForm() {
        adminEditTabActions.setAttribute("dev-display", "none");
        nameInput.value = "";
        slugInput.value = "";
        clearSelections(company);
        descriptionInput.value = "";
        insightDetails.then((val) => {
            val.setData("");
        });
        curatedInput.parentElement?.querySelectorAll("input").forEach((input) => {
            input.value = "";
        });
        sourceInput.value = "";
        sourceAuthorInput.value = "";
        sourceUrlInput.value = "";
        sourcePublicationInput.parentElement
            ?.querySelectorAll("input")
            .forEach((input) => {
            input.value = "";
        });
        internalNoteInput.value = "";
        clearSelections(sourceCategory);
        clearSelections(companyType);
        clearSelections(insightClassification);
        clearSelections(technologyCategory);
        clearSelections(companiesMentioned);
        clearSelections(people);
        clearSelections(sourceDocuments);
        clearSelections(event);
        publishedInput.checked = false;
        publishedInput.parentElement
            ?.querySelector(".w-checkbox-input")
            ?.classList.remove("w--redirected-checked");
    }
    async function getFormData() {
        return {
            id: idInput.value,
            name: nameInput.value,
            slug: slugInput.value,
            company: company.getValue() ? company.getValue().value : "",
            description: descriptionInput.value,
            internalNote: internalNoteInput.value,
            insightDetails: await insightDetails.then((val) => val.getData()),
            curated: curatedInput.value.trim() !== ""
                ? new Date(convert_MM_DD_YYYY_to_YYYY_MM_DD(curatedInput.value)).toISOString()
                : "",
            source: sourceInput.value,
            sourceAuthor: sourceAuthorInput.value,
            sourceUrl: sourceUrlInput.value,
            sourcePublication: sourcePublicationInput.value.trim() !== ""
                ? new Date(convert_MM_DD_YYYY_to_YYYY_MM_DD(sourcePublicationInput.value)).toISOString()
                : "",
            sourceCategory: sourceCategory.getValue()
                ? sourceCategory.getValue().map(({ value }) => value)
                : [],
            companyType: companyType.getValue()
                ? companyType.getValue().map(({ value }) => value)
                : [],
            insightClassification: insightClassification.getValue()
                ? insightClassification.getValue().map(({ value }) => value)
                : [],
            technologyCategory: technologyCategory.getValue()
                ? technologyCategory.getValue().map(({ value }) => value)
                : [],
            companiesMentioned: companiesMentioned.getValue()
                ? companiesMentioned.getValue().map(({ value }) => value)
                : [],
            people: people.getValue()
                ? people.getValue().map(({ value }) => value)
                : [],
            sourceDocuments: sourceDocuments.getValue()
                ? sourceDocuments.getValue().map(({ value }) => value)
                : [],
            event: event.getValue() ? event.getValue().value : [],
            published: publishedInput ? publishedInput.checked : false,
        };
    }
    const debounceSlugCheck = debounce(async (value) => {
        const res = await fetch(`https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/insight_slug_checker?slug=${value}&x-data-source=${DATA_SOURCE}`);
        const data = (await res.json());
        slugInput.classList[data ? "add" : "remove"]("is-error");
    }, 300);
    function fetchChoicesOnKeystroke(choicesInstance, endpoint, tableName) {
        const input = choicesInstance.input.element;
        fetchDataFromEndpoint("", choicesInstance, endpoint, tableName);
        // Attach input event listener to the input field
        input.addEventListener("input", () => {
            console.log("run");
            const userInput = input.value.trim();
            debouncedFetch(userInput, choicesInstance, endpoint, tableName);
        });
    }
    async function adminAction(action, id) {
        const res = await fetch(`https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/admin_action?action=${action}&insight_id=${id}&x-data-source=${DATA_SOURCE}`);
        const data = await res.json();
        return data;
    }
    const debouncedFetch = debounce(fetchDataFromEndpoint, 300);
    async function fetchDataFromEndpoint(userInput, choicesInstance, endpoint, tableName) {
        try {
            // Fetch data from the endpoint
            const response = await fetch(`${endpoint}?table_name=${tableName}&search_query=${userInput}&x-data-source=${DATA_SOURCE}`);
            if (!response.ok) {
                throw new Error("Failed to fetch data");
            }
            const data = await response.json();
            const currentSelectedID = choicesInstance.getValue(true);
            // Convert the data to the format required by Choices.js
            const choicesData = data
                .filter((item) => typeof currentSelectedID === "number"
                ? ![currentSelectedID].includes(item.id)
                : typeof currentSelectedID === "object"
                    ? !currentSelectedID.includes(item.id)
                    : true)
                .map((item) => ({
                value: item.id,
                label: item.title ? `${item.name} ${item.title}` : item.name,
                customProperties: item,
            }));
            // Update Choices.js with new choices
            choicesInstance.setChoices(choicesData, "value", "label", true);
        }
        catch (error) {
            console.error("Error fetching or parsing data:", error);
        }
    }
    function convert_MM_DD_YYYY_to_YYYY_MM_DD(date) {
        const [month, day, year] = date.split("-");
        return `${year}-${month}-${day}`;
    }
    async function moveApprovedToLive() {
        const res = await fetch(`https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/move_all_approved_insights_to_live?x-data-source=${DATA_SOURCE}`);
        const data = await res.json();
        if (adminTableBody) {
            adminTableBody.innerHTML = "";
        }
        return data;
    }
    async function deleteAllRejectedInsights() {
        const res = await fetch(`https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/delete_all_rejected_insights?x-data-source=${DATA_SOURCE}`, {
            method: "DELETE",
        });
        const data = await res.json();
        if (adminTableBody) {
            adminTableBody.innerHTML = "";
        }
        return data;
    }
    function choicesDropdownInit() {
        const choicesInstances = [
            { choicesInstance: company, tableName: "company" },
            { choicesInstance: companiesMentioned, tableName: "company" },
            { choicesInstance: people, tableName: "people" },
            { choicesInstance: event, tableName: "event" },
            { choicesInstance: sourceCategory, tableName: "source-category" },
            {
                choicesInstance: insightClassification,
                tableName: "insight-classification",
            },
            { choicesInstance: sourceDocuments, tableName: "source-documents" },
            { choicesInstance: technologyCategory, tableName: "technology-category" },
            { choicesInstance: companyType, tableName: "company-type" },
        ];
        const endpoint = "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/table-item-search";
        choicesInstances.forEach(({ choicesInstance, tableName }) => fetchDataFromEndpoint("", choicesInstance, endpoint, tableName));
    }
    function slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
    }
    function resetTableAndSearchInsightValue() {
        editTableName.destroy();
        editTableName.init();
        editInsightName.destroy();
        editInsightName.init();
        fetchDataFromEndpoint("", editInsightName, "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/get_insights", "editor_insights");
    }
    class MyUploadAdapter {
        constructor(loader) {
            // The file loader instance to use during the upload.
            this.loader = loader;
        }
        // Starts the upload process.
        upload() {
            return this.loader.file.then((file) => new Promise((resolve, reject) => {
                this._initRequest();
                this._initListeners(resolve, reject, file);
                this._sendRequest(file);
            }));
        }
        // Aborts the upload process.
        abort() {
            if (this.xhr) {
                this.xhr.abort();
            }
        }
        // Initializes the XMLHttpRequest object using the URL passed to the constructor.
        _initRequest() {
            const xhr = (this.xhr = new XMLHttpRequest());
            xhr.open("POST", "https://xhka-anc3-3fve.n7c.xano.io/api:OsMcE9hv/image_upload", true);
            xhr.responseType = "json";
        }
        // Initializes XMLHttpRequest listeners.
        _initListeners(resolve, reject, file) {
            const xhr = this.xhr;
            const loader = this.loader;
            const genericErrorText = `Couldn't upload file: ${file.name}.`;
            xhr.addEventListener("error", () => reject(genericErrorText));
            xhr.addEventListener("abort", () => reject());
            xhr.addEventListener("load", () => {
                const response = xhr.response;
                if (!response || response.error) {
                    return reject(response && response.error
                        ? response.error.message
                        : genericErrorText);
                }
                resolve({
                    default: response.url,
                });
            });
            if (xhr.upload) {
                xhr.upload.addEventListener("progress", (evt) => {
                    if (evt.lengthComputable) {
                        loader.uploadTotal = evt.total;
                        loader.uploaded = evt.loaded;
                    }
                });
            }
        }
        // Prepares the data and sends the request.
        _sendRequest(file) {
            // Prepare the form data.
            const data = new FormData();
            data.append("upload", file);
            // Send the request.
            this.xhr.send(data);
        }
    }
    function MyCustomUploadAdapterPlugin(editor) {
        editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
            // Configure the URL to the upload script in your back-end here!
            return new MyUploadAdapter(loader);
        };
    }
});
