// import { XanoClient } from "@xano/js-sdk";

document.addEventListener("DOMContentLoaded", async () => {
  const xano_individual_pages = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:CvEH0ZFk",
  });
  const xano_wmx = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:6Ie7e140",
  });
  const xano_userFeed = new XanoClient({
    apiGroupBaseUrl: "https://xhka-anc3-3fve.n7c.xano.io/api:Hv8ldLVU",
  });

  const searchObject: SearchObject = {
    search: "",
    checkboxes: {
      companyType: [],
      sourceCat: [],
      techCat: [],
      lineOfBus: [],
      insightClass: [],
    },
  };
  const sortObject = {
    sortBy: "created_at",
    orderBy: "asc",
  };

  const searchParams = new URLSearchParams(window.location.search);
  const personSlug = searchParams.get("name");

  let userFollowingAndFavourite: UserFollowingAndFavourite | null = null;
  let xanoToken: string | null = null;

  const personCard = qs("[dev-target=person-card]");
  const personDetails = qs("[dev-target=person-details]");

  const insightSearchInput = qs<HTMLInputElement>("[dev-search-target]");
  const insightFilterForm = qs<HTMLFormElement>("[dev-target=filter-form]");
  const insightClearFilters = qs<HTMLFormElement>("[dev-target=clear-filters]");
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });

  const insightTemplate = qs(`[dev-template="insight-item"]`);
  const insightTagTemplate = qs(`[dev-template="insight-tag"]`);
  const checkboxItemTemplate = qs(`[dev-template="checkbox-item"]`);

  const allTabsTarget = qs(`[dev-target="insight-all"]`);

  const filterCompanyTypeTarget = qs(`[dev-target="filter-company-type"]`);
  const filterSourceCatTarget = qs(`[dev-target="filter-source-cat"]`);
  const filterTechCatTarget = qs(`[dev-target="filter-tech-cat"]`);
  const filterLineOfBusTarget = qs(`[dev-target="filter-line-of-business"]`);
  const filterInsightClassTarget = qs(`[dev-target="filter-insight-class"]`);

  const paginationTemplate = qs(`[dev-target=pagination-wrapper]`);

  const memberStackUserToken = localStorage.getItem("_ms-mid");
  if (!memberStackUserToken) {
    return console.error("No memberstack token");
  }

  const lsUserFollowingFavourite = localStorage.getItem(
    "user-following-favourite"
  );
  const lsXanoAuthToken = localStorage.getItem("AuthToken");
  if (lsXanoAuthToken) {
    xanoToken = lsXanoAuthToken;
  }
  if (lsUserFollowingFavourite) {
    userFollowingAndFavourite = JSON.parse(lsUserFollowingFavourite);
  }

  if (!personSlug) {
    return console.error("add person name in the url eg /person/andre-gouin");
  }

  if (xanoToken) {
    xano_userFeed.setAuthToken(xanoToken);
    xano_individual_pages.setAuthToken(xanoToken);
    getXanoAccessToken(memberStackUserToken);
  } else {
    await getXanoAccessToken(memberStackUserToken);
  }
  lsUserFollowingFavourite
    ? getUserFollowingAndFavourite()
    : await getUserFollowingAndFavourite();
  peoplePageInit(personSlug);

  async function getXanoAccessToken(memberstackToken: string) {
    try {
      const res = await xano_wmx.post("/auth-user", {
        memberstack_token: memberstackToken,
      });
      const xanoAuthToken = res.getBody().authToken as string;
      xano_userFeed.setAuthToken(xanoAuthToken);
      xano_individual_pages.setAuthToken(xanoAuthToken);
      return xanoAuthToken;
    } catch (error) {
      console.log("getXanoAccessToken_error", error);
      return null;
    }
  }

  async function getUserFollowingAndFavourite() {
    try {
      const res = await xano_userFeed.get("/user-following-and-favourite");
      const followingAndFavourite = res.getBody() as UserFollowingAndFavourite;
      const { user_following } = followingAndFavourite;
      userFollowingAndFavourite = followingAndFavourite;
      localStorage.setItem(
        "user-following-favourite",
        JSON.stringify(followingAndFavourite)
      );

      return followingAndFavourite;
    } catch (error) {
      console.error(`getUserFollowingAndFavourite_error`, error);
      return null;
    }
  }

  async function peoplePageInit(personSlug: string) {
    getPersonInsights(personSlug, {});
    getPerson(personSlug);
    insightFilterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    insightSearchInput.addEventListener("input", (e) => {
      searchObject.search = insightSearchInput.value;
      searchDebounce(personSlug);
    });
    insightClearFilters.addEventListener("click", () => {
      const checkedFilters = qsa<HTMLInputElement>(
        "[dev-input-checkbox]:checked"
      );

      insightSearchInput.value = "";
      insightSearchInput.dispatchEvent(inputEvent);
      checkedFilters.forEach((input) => {
        input.click();
      });
    });
    getFilters(
      "/company_type",
      {},
      "companyType",
      filterCompanyTypeTarget,
      personSlug
    );
    getFilters(
      "/source_category",
      {},
      "sourceCat",
      filterSourceCatTarget,
      personSlug
    );
    getFilters(
      "/technology_category",
      {},
      "techCat",
      filterTechCatTarget,
      personSlug
    );
    getFilters(
      "/line_of_business",
      {},
      "lineOfBus",
      filterLineOfBusTarget,
      personSlug
    );
    getFilters(
      "/insight_classification",
      {},
      "insightClass",
      filterInsightClassTarget,
      personSlug
    );
    sortLogicInit(personSlug);
  }

  async function getPerson(slug: string) {
    try {
      const res = await xano_individual_pages.get("/person", {
        slug,
      });
      const person = res.getBody() as Person;
      console.log("person", person);

      const personName = personCard.querySelector<HTMLHeadingElement>(
        `[dev-target=person-name]`
      );
      const personTitle = personCard.querySelector<HTMLParagraphElement>(
        `[dev-target=person-title]`
      );
      const personBio = personCard.querySelector<HTMLParagraphElement>(
        `[dev-target=person-bio]`
      );
      const personCompanyLink = personCard.querySelector<HTMLLinkElement>(
        `[dev-target=person-company-link]`
      );
      const personLinkedinLink = personCard.querySelector<HTMLLinkElement>(
        `[dev-target=linkedin-link]`
      );
      const personImageWrapper = personCard.querySelector(
        `[dev-target=person-image-wrapper]`
      );
      const personImageLink =
        personImageWrapper?.querySelector<HTMLLinkElement>(
          `[dev-target=person-picture-link]`
        );
      const PersonImage = personImageWrapper?.querySelector(
        `[dev-target=person-image]`
      );
      const personInput = personImageWrapper?.querySelector<HTMLInputElement>(
        `[dev-target=person-input]`
      );

      personName!.textContent = person.name;
      personTitle!.textContent = person.title;
      personBio!.textContent = person.bio;
      personCompanyLink!.textContent = person.company_details.name;
      personCompanyLink!.href = "company/" + person.company_details.slug;
      personLinkedinLink!.href = person.linkedin;

      fakeCheckboxToggle(personInput!);
      personInput?.setAttribute("dev-input-type", "people_id");
      personInput?.setAttribute("dev-input-id", person.id.toString());
      personInput && followFavouriteLogic(personInput);
      personInput &&
        setCheckboxesInitialState(
          personInput,
          convertArrayOfObjToNumber(
            userFollowingAndFavourite!.user_following.people_id
          )
        );

      personDetails.classList.remove("opacity-hide");

      return person;
    } catch (error) {
      console.log("getPerson_error", error);
      return null;
    }
  }

  async function getPersonInsights(
    slug: string,
    payload: InsightPayload,
  ) {
    const {
      page = 0,
      perPage = 0,
      offset = 0,
      filtering = {
        search: "",
        checkboxes: {
          companyType: [],
          sourceCat: [],
          techCat: [],
          lineOfBus: [],
          insightClass: [],
        },
      },
    } = payload;
    try {
      const res = await xano_individual_pages.get("/person_insights", {
        slug,
        page,
        perPage,
        offset,
        sortBy: sortObject.sortBy,
        orderBy: sortObject.orderBy,
        filtering,
      });
      const personInsightResponse = res.getBody() as PersonInsightResponse;
      allTabsTarget.innerHTML = "";

      paginationLogic(personInsightResponse, slug);

      userFollowingAndFavourite &&
        initInsights(
          personInsightResponse,
          allTabsTarget,
          userFollowingAndFavourite
        );

      console.log("personInsightResponse", personInsightResponse);
      return personInsightResponse;
    } catch (error) {
      console.log("getPersonInsights_error", error);
      return null;
    }
  }

  async function getFilters(
    endPoint:
      | "/company_type"
      | "/insight_classification"
      | "/line_of_business"
      | "/source_category"
      | "/technology_category",
    payload: { page?: number; perPage?: number; offset?: number },
    type:
      | "companyType"
      | "sourceCat"
      | "techCat"
      | "lineOfBus"
      | "insightClass",
    targetWrapper: HTMLDivElement,
    personSlug: string
  ) {
    const { page = 0, perPage = 0, offset = 0 } = payload;
    try {
      const res = await xano_individual_pages.get(endPoint, {
        page,
        perPage,
        offset,
        type: {
          people: {
            slug: personSlug,
            value: true,
          },
        },
      });
      const filters = res.getBody() as FilterResponse;
      filters.items.forEach((filter) => {
        const newFilter = checkboxItemTemplate.cloneNode(
          true
        ) as HTMLDivElement;
        const input =
          newFilter.querySelector<HTMLInputElement>("[dev-target=input]");
        input && fakeCheckboxToggle(input);
        input?.addEventListener("change", () => {
          if (input.checked) {
            searchObject.checkboxes[type].push(filter.id);
          } else {
            searchObject.checkboxes[type] = searchObject.checkboxes[
              type
            ].filter((item) => item != filter.id);
          }
          searchDebounce(personSlug);
        });
        newFilter.querySelector("[dev-target=name]")!.textContent = filter.name;
        targetWrapper.appendChild(newFilter);
      });
      return filters;
    } catch (error) {
      console.error(`getFilters_${endPoint}_error`, error);
      return null;
    }
  }

  function initInsights(
    insights: PersonInsightResponse,
    target: HTMLDivElement,
    userFollowingAndFavourite: UserFollowingAndFavourite
  ) {
    insights.items.forEach((insight) => {
      const newInsight = insightTemplate.cloneNode(true) as HTMLDivElement;

      const tagsWrapperTarget = newInsight.querySelector<HTMLDivElement>(
        `[dev-target=tags-container]`
      );

      const companyLink = newInsight.querySelector(`[dev-target=company-link]`);
      const companyImage = newInsight.querySelector<HTMLImageElement>(
        `[dev-target=company-image]`
      );
      const insightNameTarget = newInsight.querySelector(
        `[dev-target=insight-name]`
      );
      const insightLink = newInsight.querySelector(`[dev-target=insight-link]`);
      const curatedDateTarget = newInsight.querySelector(
        `[dev-target="curated-date"]`
      );
      const publishedDateTarget = newInsight.querySelector(
        `[dev-target="published-date"]`
      );
      const sourceTarget = newInsight.querySelector(
        `[dev-target="source-name-link"]`
      );
      const sourceAuthorTarget = newInsight.querySelector(
        `[dev-target="source-author"]`
      );
      const favouriteInput = newInsight.querySelector<HTMLInputElement>(
        `[dev-target=favourite-input]`
      );
      const companyInput = newInsight.querySelector<HTMLInputElement>(
        `[dev-target=company-input]`
      );

      const curatedDate = insight.curated?.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
      const publishedDate = insight["source-publication-date"]?.toLocaleString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );
      const sourceCatArray = insight.source_category_id;
      const companyTypeArray = insight.company_type_id;
      const insightClassArray = insight.insight_classification_id;
      const lineOfBusArray = insight.line_of_business_id;
      const techCatArray = insight.technology_category_id;

      fakeCheckboxToggle(companyInput!);
      fakeCheckboxToggle(favouriteInput!);

      favouriteInput?.setAttribute("dev-input-type", "favourite");
      favouriteInput?.setAttribute("dev-input-id", insight.id.toString());
      companyInput?.setAttribute("dev-input-type", "company_id");
      companyInput?.setAttribute("dev-input-id", insight.company_id.toString());

      favouriteInput && followFavouriteLogic(favouriteInput);
      companyInput && followFavouriteLogic(companyInput);

      favouriteInput &&
        setCheckboxesInitialState(
          favouriteInput,
          userFollowingAndFavourite.user_favourite.insight_id
        );
      companyInput &&
        setCheckboxesInitialState(
          companyInput,
          convertArrayOfObjToNumber(
            userFollowingAndFavourite.user_following.company_id
          )
        );

      addTagsToInsight(sourceCatArray, tagsWrapperTarget!, false);
      addTagsToInsight(companyTypeArray, tagsWrapperTarget!, false);
      addTagsToInsight(insightClassArray, tagsWrapperTarget!, false);
      addTagsToInsight(lineOfBusArray, tagsWrapperTarget!, false);
      addTagsToInsight(
        techCatArray,
        tagsWrapperTarget!,
        true,
        "technology_category_id"
      );

      companyImage!.src = "https://logo.clearbit.com/"+insight.company_details["company-website"]
      fetch(
        "https://logo.clearbit.com/" +
          insight.company_details["company-website"]
      ).catch(
        () =>
          (companyImage!.src =
            "https://uploads-ssl.webflow.com/64a2a18ba276228b93b991d7/64c7c26d6639a8e16ee7797f_Frame%20427318722.webp")
      );
      insightNameTarget!.textContent = insight.name;
      curatedDateTarget!.textContent = curatedDate ?? "";
      publishedDateTarget!.textContent = publishedDate ?? "";
      insightLink!.setAttribute("href", "/insight/" + insight.slug);
      sourceTarget!.setAttribute("href", insight["source-url"]);
      companyLink!.setAttribute(
        "href",
        "/company/" + insight.company_details.slug
      );
      sourceTarget!.textContent = insight.source;
      sourceAuthorTarget!.textContent = insight.source_author;
      target.appendChild(newInsight);
    });
  }

  const searchDebounce = debounce(insightSearch, 500);

  function insightSearch(personSlug: string) {
    getPersonInsights(personSlug, {
      filtering: searchObject,
      orderBy: sortObject.orderBy,
      sortBy: sortObject.sortBy,
    });
  }

  function sortLogicInit(personSlug: string) {
    const sortItems = qsa<HTMLLinkElement>(`[dev-target="sort"]`);
    sortItems.forEach((item) => {
      item.addEventListener("click", () => {
        const orderBy = item.getAttribute("dev-orderby");
        const sortBy = item.getAttribute("dev-sortby");

        if (sortBy && orderBy) {
          sortObject.sortBy = sortBy;
          sortObject.orderBy = orderBy;
        }

        getPersonInsights(personSlug, {});

        // getInsights("/insight-all-tab", {}, allTabsTarget);
        // getInsights("/insight-following-tab", {}, followingTabsTarget);
        // getInsights("/insight-favourite-tab", {}, favouriteTabsTarget);
      });
    });
  }

  function followFavouriteLogic(input: HTMLInputElement) {
    input.addEventListener("change", async () =>
      followFavouriteDebounce(input)
    );
  }

  const followFavouriteDebounce = debounce(followFavouriteListener, 500);

  async function followFavouriteListener(input: HTMLInputElement) {
    const type = input.getAttribute("dev-input-type")!;
    const id = input.getAttribute("dev-input-id")!;
    const endPoint =
      type === "favourite" ? "/toggle-favourite" : "/toggle-follow";
    try {
      const res = await xano_userFeed.get(endPoint, {
        id: Number(id),
        target: type,
      });
      await getUserFollowingAndFavourite();
      // run function to updated all-tab inputs

      allTabsTarget.childNodes.forEach((insight) => {
        updateInsightsInputs(insight as HTMLDivElement);
      });
    } catch (error) {
      console.error(`followFavouriteLogic${endPoint}_error`, error);
      return null;
    }
  }

  function updateInsightsInputs(insight: HTMLDivElement) {
    const companyInput = insight.querySelector<HTMLInputElement>(
      `[dev-input-type="company_id"]`
    );
    const favourite = insight.querySelector<HTMLInputElement>(
      `[dev-input="fav-insight"]`
    );
    const tagInputs = insight.querySelectorAll<HTMLInputElement>(
      `[dev-input-type="technology_category_id"]`
    );

    companyInput &&
      setCheckboxesInitialState(
        companyInput,
        convertArrayOfObjToNumber(
          userFollowingAndFavourite?.user_following.company_id!
        )
      );
    favourite &&
      setCheckboxesInitialState(
        favourite,
        userFollowingAndFavourite?.user_favourite.insight_id!
      );

    tagInputs?.forEach((tag) => {
      setCheckboxesInitialState(
        tag,
        convertArrayOfObjToNumber(
          userFollowingAndFavourite?.user_following.technology_category_id!
        )
      );
    });
  }

  function setCheckboxesInitialState(
    input: HTMLInputElement,
    slugArray: number[]
  ) {
    const inputId = input.getAttribute("dev-input-id");

    if (slugArray.includes(Number(inputId))) {
      input.checked = true;
      input
        .closest<HTMLDivElement>("[dev-fake-checkbox-wrapper]")
        ?.classList.add("checked");
    } else {
      input.checked = false;
      input
        .closest<HTMLDivElement>("[dev-fake-checkbox-wrapper]")
        ?.classList.remove("checked");
    }
  }

  function addTagsToInsight(
    tagArray: (
      | 0
      | {
          id: number;
          name: string;
          slug: string;
        }
      | null
    )[],
    targetWrapper: HTMLDivElement,
    showCheckbox: boolean,
    type?: "technology_category_id"
  ) {
    tagArray.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        const newTag = insightTagTemplate.cloneNode(true) as HTMLDivElement;
        const tagCheckbox = newTag.querySelector<HTMLDivElement>(
          `[dev-target=fake-checkbox]`
        );
        const tagInput = newTag.querySelector<HTMLInputElement>(
          `[dev-target=tag-input]`
        );
        tagInput && fakeCheckboxToggle(tagInput);
        type && tagInput && tagInput.setAttribute("dev-input-type", type);
        tagInput && tagInput.setAttribute("dev-input-id", item.id.toString());
        tagInput && followFavouriteLogic(tagInput);
        newTag.querySelector(`[dev-target=tag-name]`)!.textContent =
          item?.name!;

        if (tagCheckbox && !showCheckbox) {
          tagCheckbox.style.display = "none";
        }
        if (showCheckbox && tagInput && userFollowingAndFavourite) {
          setCheckboxesInitialState(
            tagInput,
            convertArrayOfObjToNumber(
              userFollowingAndFavourite?.user_following.technology_category_id
            )
          );
        }

        targetWrapper?.appendChild(newTag);
      }
    });
  }

  function paginationLogic(insight: PersonInsightResponse, personSlug: string) {
    const paginationTarget = qs(`[dev-target="all-tab-pagination_wrapper"]`);

    const { curPage, nextPage, prevPage, pageTotal, itemsReceived } = insight;
    const paginationWrapper = paginationTarget.closest(
      `[dev-target="insight-pagination-wrapper"]`
    );
    const pagination = paginationTemplate.cloneNode(true) as HTMLDivElement;
    const prevBtn = pagination.querySelector(
      `[dev-target=pagination-previous]`
    ) as HTMLButtonElement;
    const nextBtn = pagination.querySelector(
      `[dev-target=pagination-next]`
    ) as HTMLButtonElement;
    const pageItemWrapper = pagination.querySelector(
      `[dev-target=pagination-number-wrapper]`
    ) as HTMLDivElement;
    const pageItem = pagination
      .querySelector(`[dev-target=page-number-temp]`)
      ?.cloneNode(true) as HTMLButtonElement;

    paginationTarget.innerHTML = "";
    pageItemWrapper.innerHTML = "";

    if (itemsReceived === 0) {
      paginationTarget?.classList.add("hide");
      paginationWrapper
        ?.querySelector(`[dev-tab-empty-state]`)
        ?.classList.remove("hide");
    } else {
      paginationTarget?.classList.remove("hide");
      paginationWrapper
        ?.querySelector(`[dev-tab-empty-state]`)
        ?.classList.add("hide");
    }

    if (pageTotal <= 6) {
      for (let i = 1; i <= pageTotal; i++) {
        const pageNumItem = pageItem.cloneNode(true) as HTMLDivElement;
        pageNumItem.textContent = i.toString();
        pageNumItem.classList[curPage === i ? "add" : "remove"]("active");
        pageNumItem.addEventListener("click", () => {
          paginationWrapper?.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          getPersonInsights(personSlug, { page: i });
          //   getInsights(endPoint, { page: i }, tagTarget);
        });
        pageItemWrapper.appendChild(pageNumItem);
      }
    } else {
      const firstPageNumItem = pageItem.cloneNode(true) as HTMLButtonElement;
      firstPageNumItem.textContent = "1";
      firstPageNumItem.classList[curPage === 1 ? "add" : "remove"]("active");
      firstPageNumItem.addEventListener("click", () => {
        paginationWrapper?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        getPersonInsights(personSlug, { page: 1 });
        // getInsights(endPoint, { page: 1 }, tagTarget);
      });
      pageItemWrapper.appendChild(firstPageNumItem);

      if (curPage > 3) {
        const pagItemDots = pageItem.cloneNode(true) as HTMLButtonElement;
        pagItemDots.textContent = "...";
        pagItemDots.classList["add"]("not-allowed");
        pageItemWrapper.appendChild(pagItemDots);
      }

      for (
        let i = Math.max(2, curPage - 1);
        i <= Math.min(curPage + 1, pageTotal - 1);
        i++
      ) {
        const pageNumItem = pageItem.cloneNode(true) as HTMLButtonElement;
        pageNumItem.classList[curPage === i ? "add" : "remove"]("active");
        pageNumItem.textContent = i.toString();
        pageNumItem.addEventListener("click", () => {
          paginationWrapper?.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
          getPersonInsights(personSlug, { page: i });
          //   getInsights(endPoint, { page: i }, tagTarget);
        });
        pageItemWrapper.appendChild(pageNumItem);
      }

      if (curPage < pageTotal - 2) {
        const pagItemDots = pageItem.cloneNode(true) as HTMLButtonElement;
        pagItemDots.textContent = "...";
        pagItemDots.classList["add"]("not-allowed");
        pageItemWrapper.appendChild(pagItemDots);
      }

      const pageNumItem = pageItem.cloneNode(true) as HTMLButtonElement;
      pageNumItem.textContent = pageTotal.toString();
      pageNumItem.classList[curPage === pageTotal ? "add" : "remove"]("active");
      pageNumItem.addEventListener("click", () => {
        paginationWrapper?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        getPersonInsights(personSlug, { page: 1 });
        // getInsights(endPoint, { page: pageTotal }, tagTarget);
      });
      pageItemWrapper.appendChild(pageNumItem);
    }

    prevBtn.classList[prevPage ? "remove" : "add"]("disabled");
    nextBtn.classList[nextPage ? "remove" : "add"]("disabled");

    nextPage &&
      nextBtn.addEventListener("click", () => {
        paginationWrapper?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        getPersonInsights(personSlug, { page: curPage + 1 });
        // getInsights(endPoint, { page: curPage + 1 }, tagTarget);
      });
    prevPage &&
      prevBtn.addEventListener("click", () => {
        paginationWrapper?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        getPersonInsights(personSlug, { page: curPage - 1 });
        // getInsights(endPoint, { page: curPage - 1 }, tagTarget);
      });
    pagination.style.display = pageTotal === 1 ? "none" : "flex";
    paginationTarget.appendChild(pagination);
  }

  // Function to debounce a given function
  function debounce(func: (...args: any[]) => void, delay: number) {
    let debounceTimer: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
      const context = this;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
  }

  // Function for querying a single element by selector
  function qs<T extends HTMLElement = HTMLDivElement>(selector: string): T {
    return document.querySelector(selector) as T;
  }

  // Function to toggle fake checkboxes
  function fakeCheckboxToggle(input: HTMLInputElement) {
    input.addEventListener("change", () => {
      const inputWrapper = input.closest(
        "[dev-fake-checkbox-wrapper]"
      ) as HTMLDivElement;
      inputWrapper.classList[input.checked ? "add" : "remove"]("checked");
    });
  }

  function convertArrayOfObjToNumber(data: { id: number }[]) {
    return data.map((item) => item.id);
  }

  // Function for querying multiple elements by selector
  function qsa<T extends HTMLElement = HTMLDivElement>(
    selector: string
  ): NodeListOf<T> {
    return document.querySelectorAll(selector) as NodeListOf<T>;
  }
});

interface Person {
  id: number;
  name: string;
  slug: string;
  title: string;
  bio: string;
  company_id: number;
  linkedin: string;
  picture: null;
  company_details: {
    id: number;
    name: string;
    slug: string;
  };
}

interface PersonInsightResponse {
  itemsReceived: number;
  curPage: number;
  nextPage: null;
  prevPage: null;
  offset: number;
  itemsTotal: number;
  pageTotal: number;
  items: {
    id: number;
    created_at: number;
    name: string;
    slug: string;
    company_id: number;
    description: string;
    "insight-detail": string;
    curated: Date;
    source_author: string;
    source: string;
    "source-url": string;
    "source-publication-date": Date;
    source_category_id: any[];
    company_type_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    insight_classification_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    line_of_business_id: any[];
    technology_category_id: {
      id: number;
      name: string;
      slug: string;
    }[];
    "companies-mentioned": any[];
    people_id: number[];
    event_id: number;
    published: boolean;
    company_details: {
      id: number;
      name: string;
      slug: string;
      "company-website":string
    };
  }[];
}