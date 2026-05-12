/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { createCardElement, deleteCard, updateLike } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";
import { enableValidation, clearValidation } from "./components/validation.js";
import { getUserInfo, getCardList, setUserInfo, setUserAvatar, addNewCard, deleteCardApi, changeLikeCardStatus } from "./components/api.js";

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

const logo = document.querySelector(".logo");
const infoModalWindow = document.querySelector(".popup_type_info");
const infoModalTitle = infoModalWindow.querySelector(".popup__title");
const infoModalInfoList = infoModalWindow.querySelector(".popup__info");
const infoModalText = infoModalWindow.querySelector(".popup__text");
const infoModalUserList = infoModalWindow.querySelector(".popup__list");

// Вспомогательные функции
const renderLoading = (isLoading, button, defaultText) => {
  button.textContent = isLoading ? "Сохранение..." : defaultText;
};

const formatDate = (date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const createInfoString = (term, description) => {
  const template = document.getElementById("popup-info-definition-template");
  const item = template.content.cloneNode(true);
  item.querySelector(".popup__info-term").textContent = term;
  item.querySelector(".popup__info-description").textContent = description;
  return item;
};

// Обработчики
const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleDeleteCard = (cardId, cardElement) => {
  deleteCardApi(cardId)
    .then(() => {
      deleteCard(cardElement);
    })
    .catch((err) => console.log(err));
};

const handleLikeCard = (cardId, isLiked, likeButton, likeCount) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((cardData) => {
      updateLike(cardData.likes, likeButton, likeCount);
    })
    .catch((err) => console.log(err));
};

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = profileForm.querySelector(".popup__button");
  renderLoading(true, submitButton, "Сохранить");
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => renderLoading(false, submitButton, "Сохранить"));
};

const handleAvatarFromSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = avatarForm.querySelector(".popup__button");
  renderLoading(true, submitButton, "Сохранить");
  setUserAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => console.log(err))
    .finally(() => renderLoading(false, submitButton, "Сохранить"));
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  const submitButton = cardForm.querySelector(".popup__button");
  renderLoading(true, submitButton, "Создать");
  addNewCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((cardData) => {
      placesWrap.prepend(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeCard,
          onDeleteCard: handleDeleteCard,
        }, cardData.owner._id)
      );
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => console.log(err))
    .finally(() => renderLoading(false, submitButton, "Создать"));
};

const handleLogoClick = () => {
  getCardList()
    .then((cards) => {
      infoModalInfoList.innerHTML = "";
      infoModalUserList.innerHTML = "";
      infoModalTitle.textContent = "Статистика карточек";
      infoModalText.textContent = "Активные авторы";

      const authors = {};
      cards.forEach((card) => {
        authors[card.owner.name] = (authors[card.owner.name] || 0) + 1;
      });

      const uniqueUsers = Object.keys(authors).length;
      const maxCards = Math.max(...Object.values(authors));

      infoModalInfoList.append(createInfoString("Всего карточек:", cards.length));
      infoModalInfoList.append(createInfoString("Всего пользователей:", uniqueUsers));
      infoModalInfoList.append(createInfoString("Максимум карточек от одного:", maxCards));
      infoModalInfoList.append(
        createInfoString("Первая создана:", formatDate(new Date(cards[cards.length - 1].createdAt)))
      );
      infoModalInfoList.append(
        createInfoString("Последняя создана:", formatDate(new Date(cards[0].createdAt)))
      );

      Object.entries(authors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([name, count]) => {
          const template = document.getElementById("popup-info-user-preview-template");
          const item = template.content.cloneNode(true);
          item.querySelector(".popup__list-item").textContent = `${name}: ${count}`;
          infoModalUserList.append(item);
        });

      openModalWindow(infoModalWindow);
    })
    .catch((err) => console.log(err));
};

// EventListeners
profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFromSubmit);
logo.addEventListener("click", handleLogoClick);

const validationSettings = {
  formSelector: ".popup__form",
  inputSelector: ".popup__input",
  submitButtonSelector: ".popup__button",
  inactiveButtonClass: "popup__button_disabled",
  inputErrorClass: "popup__input_type_error",
  errorClass: "popup__error_visible",
};

enableValidation(validationSettings);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  clearValidation(profileForm, validationSettings);
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  clearValidation(avatarForm, validationSettings);
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  clearValidation(cardForm, validationSettings);
  openModalWindow(cardFormModalWindow);
});

// Отображение карточек
Promise.all([getCardList(), getUserInfo()])
  .then(([cards, userData]) => {
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    profileAvatar.style.backgroundImage = `url(${userData.avatar})`;

    cards.forEach((cardData) => {
      placesWrap.append(
        createCardElement(cardData, {
          onPreviewPicture: handlePreviewPicture,
          onLikeIcon: handleLikeCard,
          onDeleteCard: handleDeleteCard,
        }, userData._id)
      );
    });
  })
  .catch((err) => console.log(err));

// обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});