// =====================================
// السيارات المحفوظة
// =====================================

function getSavedCars() {

    return JSON.parse(
        localStorage.getItem("eliteCars")
    ) || [];

}


// =====================================
// جميع السيارات
// =====================================

function getAllCars() {

    return getSavedCars();

}

// =====================================
// الحصول على الصورة الرئيسية
// =====================================

function getMainImage(car) {

    if (
        car.images &&
        car.images.length > 0
    ) {

        return car.images[0];

    }

    return car.image || "";

}


// =====================================
// الانتقال إلى تفاصيل السيارة
// =====================================

function openCarDetails(carId) {

    window.location.href =
        "car-details.html?car=" + carId;

}


// =====================================
// زر التواصل
// =====================================

function contactUs() {

    alert(
        "شكرًا لاهتمامك بالسيارة. سيتم التواصل معك قريبًا."
    );

}


// =====================================
// لون حالة السيارة
// =====================================

function getStatusClass(status) {

    if (status === "مباعة") {
        return "status-sold";
    }

    if (status === "محجوزة") {
        return "status-reserved";
    }

    return "status-available";

}


// =====================================
// عرض السيارات في الصفحة الرئيسية
// =====================================

function displayCars(carsToDisplay) {

    const container =
        document.getElementById(
            "carsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (carsToDisplay.length === 0) {

        container.innerHTML = `
            <p style="
                text-align:center;
                grid-column:1/-1;
                font-size:20px;
            ">
                لا توجد سيارات مطابقة للبحث
            </p>
        `;

        return;
    }


    carsToDisplay.forEach(function(car) {

        const card =
            document.createElement("div");


        card.className =
            "car-card";


        const mainImage =
            getMainImage(car);


        card.innerHTML = `

            <img
                src="${mainImage}"
                alt="${car.name}"
            >


            <div class="car-info">

                <h3>
                    ${car.name}
                </h3>


                <p>
                    ${car.year}
                    •
                    ${car.type}
                    •
                    ${car.brand}
                </p>


                <p
                    class="car-status ${getStatusClass(
                        car.status
                    )}"
                >
                    الحالة:
                    ${car.status || "متوفرة"}
                </p>


                <strong>
                    ${car.price}
                </strong>


                <button
                    onclick="openCarDetails('${car.id}')"
                >
                    عرض التفاصيل
                </button>

            </div>

        `;


        container.appendChild(card);

    });

}


// =====================================
// البحث والتصفية
// =====================================

function filterCars() {

    const searchElement =
        document.getElementById(
            "searchInput"
        );

    const brandElement =
        document.getElementById(
            "brandFilter"
        );

    const yearElement =
        document.getElementById(
            "yearFilter"
        );

    const typeElement =
        document.getElementById(
            "typeFilter"
        );


    if (
        !searchElement ||
        !brandElement ||
        !yearElement ||
        !typeElement
    ) {

        return;

    }


    const searchValue =
        searchElement.value
            .toLowerCase();


    const brandValue =
        brandElement.value;


    const yearValue =
        yearElement.value;


    const typeValue =
        typeElement.value;


    const results =
        getAllCars().filter(
            function(car) {

                const matchesSearch =
                    car.name
                        .toLowerCase()
                        .includes(searchValue);


                const matchesBrand =
                    brandValue === "" ||
                    car.brand === brandValue;


                const matchesYear =
                    yearValue === "" ||
                    car.year === yearValue;


                const matchesType =
                    typeValue === "" ||
                    car.type === typeValue;


                return (
                    matchesSearch &&
                    matchesBrand &&
                    matchesYear &&
                    matchesType
                );

            }
        );


    displayCars(results);

}


// =====================================
// البحث أثناء الكتابة
// =====================================

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        filterCars
    );

}


// =====================================
// عرض السيارات عند فتح الرئيسية
// =====================================

if (
    document.getElementById(
        "carsContainer"
    )
) {

    displayCars(
        getAllCars()
    );

}


// =====================================
// تفاصيل السيارة
// =====================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const carId =
    urlParams.get("car");


if (carId) {

    const selectedCar =
        getAllCars().find(
            function(car) {

                return car.id === carId;

            }
        );


    if (
        selectedCar &&
        document.getElementById(
            "carName"
        )
    ) {

        document.getElementById(
            "carName"
        ).textContent =
            selectedCar.name;


        document.getElementById(
            "carPrice"
        ).textContent =
            selectedCar.price;


        document.getElementById(
            "carYear"
        ).textContent =
            selectedCar.year;


        document.getElementById(
            "carBrand"
        ).textContent =
            selectedCar.brand;


        document.getElementById(
            "carModel"
        ).textContent =
            selectedCar.model;


        document.getElementById(
            "carType"
        ).textContent =
            selectedCar.type;


        document.getElementById(
            "carEngine"
        ).textContent =
            selectedCar.engine;


        document.getElementById(
            "carTransmission"
        ).textContent =
            selectedCar.transmission;


        const detailImage =
    document.getElementById(
        "carImage"
    );


if (detailImage) {

    detailImage.src =
        getMainImage(selectedCar);

    detailImage.alt =
        selectedCar.name;

}


// =====================================
// معرض صور السيارة
// =====================================

const thumbnails =
    document.getElementById(
        "carThumbnails"
    );


if (
    thumbnails &&
    selectedCar
) {

    thumbnails.innerHTML = "";


    let images = [];


    // السيارات الجديدة

    if (
        selectedCar.images &&
        selectedCar.images.length > 0
    ) {

        images =
            selectedCar.images;

    }

    // السيارات القديمة

    else if (
        selectedCar.image
    ) {

        images = [
            selectedCar.image
        ];

    }


    images.forEach(
        function(image, index) {

            const thumbnail =
                document.createElement(
                    "img"
                );


            thumbnail.src =
                image;


            thumbnail.alt =
                selectedCar.name;


            thumbnail.className =
                "car-thumbnail";


            // الصورة الأولى تكون محددة

            if (index === 0) {

                thumbnail.classList.add(
                    "active"
                );

            }


            thumbnail.addEventListener(
                "click",
                function() {

                    detailImage.src =
                        image;


                    document
                        .querySelectorAll(
                            ".car-thumbnail"
                        )
                        .forEach(
                            function(item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    thumbnail.classList.add(
                        "active"
                    );

                }
            );


            thumbnails.appendChild(
                thumbnail
            );

        }
    );

}

    }

}


// =====================================
// اختيار صور السيارة
// =====================================

let selectedImages = [];


const carImagesInput =
    document.getElementById(
        "carImagesInput"
    );


if (carImagesInput) {

    carImagesInput.addEventListener(
        "change",
        function() {

            selectedImages = [];


            const files =
                Array.from(
                    carImagesInput.files
                );


            if (files.length === 0) {
                return;
            }


            let loadedImages = 0;


            files.forEach(
                function(file, index) {

                    const reader =
                        new FileReader();


                    reader.onload =
                        function(event) {

                            selectedImages[index] =
                                event.target.result;


                            loadedImages++;


                            if (
                                loadedImages ===
                                files.length
                            ) {

                                showImagePreview();

                            }

                        };


                    reader.readAsDataURL(file);

                }
            );

        }
    );

}


// =====================================
// معاينة الصور قبل الحفظ
// =====================================

function showImagePreview() {

    const preview =
        document.getElementById(
            "imagePreview"
        );


    if (!preview) {
        return;
    }


    preview.innerHTML = "";


    selectedImages.forEach(
        function(image, index) {

            const imageBox =
                document.createElement(
                    "div"
                );


            imageBox.className =
                "preview-image-box";


            imageBox.innerHTML = `

                <img
                    src="${image}"
                    alt="صورة السيارة"
                >

                ${
                    index === 0
                    ?
                    `
                    <span class="main-image-label">
                        ⭐ الصورة الرئيسية
                    </span>
                    `
                    :
                    ""
                }

            `;


            preview.appendChild(
                imageBox
            );

        }
    );

}


// =====================================
// إضافة سيارة جديدة
// =====================================

const addCarForm =
    document.getElementById(
        "addCarForm"
    );


if (addCarForm) {

    addCarForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            // -----------------------------
            // قراءة البيانات
            // -----------------------------

            const name =
                document.getElementById(
                    "carNameInput"
                ).value.trim();


            const brand =
                document.getElementById(
                    "carBrandInput"
                ).value.trim();


            const model =
                document.getElementById(
                    "carModelInput"
                ).value.trim();


            const year =
                document.getElementById(
                    "carYearInput"
                ).value.trim();


            const type =
                document.getElementById(
                    "carTypeInput"
                ).value;


            const engine =
                document.getElementById(
                    "carEngineInput"
                ).value.trim();


            const transmission =
                document.getElementById(
                    "carTransmissionInput"
                ).value.trim();


            const price =
                document.getElementById(
                    "carPriceInput"
                ).value.trim();


            const description =
                document.getElementById(
                    "carDescriptionInput"
                ).value.trim();


            // -----------------------------
            // التأكد من وجود صورة
            // -----------------------------

            if (
                selectedImages.length === 0
            ) {

                alert(
                    "يرجى اختيار صورة واحدة على الأقل"
                );

                return;

            }


            // -----------------------------
            // إنشاء ID
            // -----------------------------

            const id =
                "car-" + Date.now();


            // -----------------------------
            // إنشاء السيارة
            // -----------------------------

            const newCar = {

                id: id,

                name: name,

                brand: brand,

                model: model,

                year: year,

                type: type,

                engine: engine,

                transmission: transmission,

                price: price,

                images: selectedImages,

                description: description,

                status: "متوفرة"

            };


            // -----------------------------
            // جلب السيارات المحفوظة
            // -----------------------------

            const savedCars =
                getSavedCars();


            // -----------------------------
            // إضافة السيارة
            // -----------------------------

            savedCars.push(
                newCar
            );


            // -----------------------------
            // الحفظ
            // -----------------------------

            try {

                localStorage.setItem(
                    "eliteCars",
                    JSON.stringify(
                        savedCars
                    )
                );

            }
            catch (error) {

                alert(
                    "لم يتم حفظ الصور. حجم الصور كبير جدًا بالنسبة لمساحة المتصفح. اختر صورًا أصغر أو عددًا أقل من الصور."
                );

                console.error(error);

                return;

            }


            // -----------------------------
            // رسالة النجاح
            // -----------------------------

            alert(
                "تمت إضافة السيارة بنجاح 🚗"
            );


            // -----------------------------
            // تنظيف النموذج
            // -----------------------------

            addCarForm.reset();

            selectedImages = [];


            const preview =
                document.getElementById(
                    "imagePreview"
                );


            if (preview) {
                preview.innerHTML = "";
            }

        }
    );

}


// =====================================
// لوحة الإدارة
// =====================================

function displayAdminCars(
    carsToDisplay
) {

    const container =
        document.getElementById(
            "adminCarsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (
        carsToDisplay.length === 0
    ) {

        container.innerHTML = `
            <p class="no-cars">
                لا توجد سيارات
            </p>
        `;

        return;

    }


    carsToDisplay.forEach(
        function(car) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "admin-car-card";


            const mainImage =
                getMainImage(car);


            card.innerHTML = `

                <img
                    src="${mainImage}"
                    alt="${car.name}"
                >


                <div class="admin-car-info">

                    <h3>
                        ${car.name}
                    </h3>


                    <p>
                        ${car.year}
                        •
                        ${car.brand}
                        •
                        ${car.type}
                    </p>


                    <strong>
                        ${car.price}
                    </strong>


                    <p>
                        الحالة:
                        <b>
                            ${car.status || "متوفرة"}
                        </b>
                    </p>


                    <div class="admin-buttons">

                        <button
                            onclick="editCar('${car.id}')"
                        >
                            ✏️ تعديل
                        </button>


                        <button
                            onclick="deleteCar('${car.id}')"
                        >
                            🗑️ حذف
                        </button>


                        <button
                            onclick="changeCarStatus('${car.id}')"
                        >
                            🔄 تغيير الحالة
                        </button>

                    </div>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================
// تشغيل لوحة الإدارة
// =====================================

if (
    document.getElementById(
        "adminCarsContainer"
    )
) {

    displayAdminCars(
        getAllCars()
    );

}


// =====================================
// البحث في لوحة الإدارة
// =====================================

const adminSearchInput =
    document.getElementById(
        "adminSearchInput"
    );


if (adminSearchInput) {

    adminSearchInput.addEventListener(
        "input",
        function() {

            const value =
                adminSearchInput.value
                    .toLowerCase();


            const results =
                getAllCars().filter(
                    function(car) {

                        return (

                            car.name
                                .toLowerCase()
                                .includes(value)

                            ||

                            car.brand
                                .toLowerCase()
                                .includes(value)

                            ||

                            car.model
                                .toLowerCase()
                                .includes(value)

                        );

                    }
                );


            displayAdminCars(
                results
            );

        }
    );

}


// =====================================
// حذف سيارة
// =====================================

function deleteCar(carId) {

    const confirmed =
        confirm(
            "هل أنت متأكد من حذف هذه السيارة؟"
        );


    if (!confirmed) {
        return;
    }


    let savedCars =
        getSavedCars();


    savedCars =
        savedCars.filter(
            function(car) {

                return car.id !== carId;

            }
        );


    localStorage.setItem(
        "eliteCars",
        JSON.stringify(
            savedCars
        )
    );


    alert(
        "تم حذف السيارة بنجاح 🗑️"
    );


    displayAdminCars(
        getAllCars()
    );

}


// =====================================
// تغيير حالة السيارة
// =====================================

function changeCarStatus(carId) {

    let savedCars =
        getSavedCars();


    const car =
        savedCars.find(
            function(car) {

                return car.id === carId;

            }
        );


    if (!car) {

        alert(
            "هذه السيارة الأساسية لا يمكن تغيير حالتها حاليًا."
        );

        return;

    }


    const newStatus =
        prompt(
            "اكتب حالة السيارة:\n\n" +
            "متوفرة\n" +
            "محجوزة\n" +
            "مباعة"
        );


    if (!newStatus) {
        return;
    }


    const status =
        newStatus.trim();


    const allowedStatuses = [
        "متوفرة",
        "محجوزة",
        "مباعة"
    ];


    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        alert(
            "الحالة غير صحيحة.\n\n" +
            "استخدم:\n" +
            "متوفرة\n" +
            "محجوزة\n" +
            "مباعة"
        );

        return;

    }


    car.status =
        status;


    localStorage.setItem(
        "eliteCars",
        JSON.stringify(
            savedCars
        )
    );


    alert(
        "تم تغيير حالة السيارة بنجاح"
    );


    displayAdminCars(
        getAllCars()
    );

}
// =====================================
// تعديل السيارة
// =====================================

function editCar(carId) {

    window.location.href =
        "edit-car.html?car=" + carId;

}


// =====================================
// قراءة السيارة المطلوب تعديلها
// =====================================

const editParams =
    new URLSearchParams(
        window.location.search
    );


const editCarId =
    editParams.get("car");


// الصور الجديدة
let editSelectedImages = [];


// السيارة التي سيتم تعديلها
let carToEdit = null;


// =====================================
// تحميل بيانات السيارة
// =====================================

if (
    editCarId &&
    document.getElementById("editCarForm")
) {

    const savedCars =
        getSavedCars();


    carToEdit =
        savedCars.find(
            function(car) {

                return car.id === editCarId;

            }
        );


    if (!carToEdit) {

        alert(
            "السيارة غير موجودة"
        );

        window.location.href =
            "admin.html";

    }

    else {

        // الاسم

        document.getElementById(
            "editCarName"
        ).value =
            carToEdit.name || "";


        // الماركة

        document.getElementById(
            "editCarBrand"
        ).value =
            carToEdit.brand || "";


        // الموديل

        document.getElementById(
            "editCarModel"
        ).value =
            carToEdit.model || "";


        // السنة

        document.getElementById(
            "editCarYear"
        ).value =
            carToEdit.year || "";


        // النوع

        document.getElementById(
            "editCarType"
        ).value =
            carToEdit.type || "SUV";


        // المحرك

        document.getElementById(
            "editCarEngine"
        ).value =
            carToEdit.engine || "";


        // ناقل الحركة

        document.getElementById(
            "editCarTransmission"
        ).value =
            carToEdit.transmission || "";


        // السعر

        document.getElementById(
            "editCarPrice"
        ).value =
            carToEdit.price || "";


        // الوصف

        document.getElementById(
            "editCarDescription"
        ).value =
            carToEdit.description || "";


        // عرض الصور الحالية

        showCurrentEditImages();

    }

}


// =====================================
// الصور الحالية
// =====================================

function getCarImages(car) {

    if (
        car.images &&
        car.images.length > 0
    ) {

        return car.images;

    }


    if (car.image) {

        return [
            car.image
        ];

    }


    return [];

}


// =====================================
// عرض الصور الحالية
// =====================================

function showCurrentEditImages() {

    const preview =
        document.getElementById(
            "editImagePreview"
        );


    if (
        !preview ||
        !carToEdit
    ) {

        return;

    }


    const images =
        getCarImages(carToEdit);


    preview.innerHTML = "";


    images.forEach(
        function(image, index) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "preview-image-box";


            box.innerHTML = `

                <img
                    src="${image}"
                    alt="${carToEdit.name}"
                >

                ${
                    index === 0
                    ?
                    `
                    <span class="main-image-label">
                        ⭐ الصورة الرئيسية
                    </span>
                    `
                    :
                    ""
                }

            `;


            preview.appendChild(
                box
            );

        }
    );

}


// =====================================
// اختيار صور جديدة
// =====================================

const editImagesInput =
    document.getElementById(
        "editCarImages"
    );


if (editImagesInput) {

    editImagesInput.addEventListener(
        "change",
        function() {

            editSelectedImages = [];


            const files =
                Array.from(
                    editImagesInput.files
                );


            if (
                files.length === 0
            ) {

                return;

            }


            let loadedImages = 0;


            files.forEach(
                function(file, index) {

                    const reader =
                        new FileReader();


                    reader.onload =
                        function(event) {

                            editSelectedImages[index] =
                                event.target.result;


                            loadedImages++;


                            if (
                                loadedImages ===
                                files.length
                            ) {

                                showNewEditImages();

                            }

                        };


                    reader.readAsDataURL(file);

                }
            );

        }
    );

}


// =====================================
// معاينة الصور الجديدة
// =====================================

function showNewEditImages() {

    const preview =
        document.getElementById(
            "editImagePreview"
        );


    if (!preview) {
        return;
    }


    preview.innerHTML = "";


    editSelectedImages.forEach(
        function(image, index) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "preview-image-box";


            box.innerHTML = `

                <img
                    src="${image}"
                    alt="صورة جديدة"
                >

                ${
                    index === 0
                    ?
                    `
                    <span class="main-image-label">
                        ⭐ الصورة الرئيسية
                    </span>
                    `
                    :
                    ""
                }

            `;


            preview.appendChild(
                box
            );

        }
    );

}


// =====================================
// حفظ تعديلات السيارة
// =====================================

const editCarForm =
    document.getElementById(
        "editCarForm"
    );


if (editCarForm) {

    editCarForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            if (!carToEdit) {

                alert(
                    "السيارة غير موجودة"
                );

                return;

            }


            // -----------------------------
            // قراءة البيانات الجديدة
            // -----------------------------

            carToEdit.name =
                document.getElementById(
                    "editCarName"
                ).value.trim();


            carToEdit.brand =
                document.getElementById(
                    "editCarBrand"
                ).value.trim();


            carToEdit.model =
                document.getElementById(
                    "editCarModel"
                ).value.trim();


            carToEdit.year =
                document.getElementById(
                    "editCarYear"
                ).value.trim();


            carToEdit.type =
                document.getElementById(
                    "editCarType"
                ).value;


            carToEdit.engine =
                document.getElementById(
                    "editCarEngine"
                ).value.trim();


            carToEdit.transmission =
                document.getElementById(
                    "editCarTransmission"
                ).value.trim();


            carToEdit.price =
                document.getElementById(
                    "editCarPrice"
                ).value.trim();


            carToEdit.description =
                document.getElementById(
                    "editCarDescription"
                ).value.trim();


            // -----------------------------
            // الصور
            // -----------------------------

            if (
                editSelectedImages.length > 0
            ) {

                carToEdit.images =
                    editSelectedImages;

            }


            // -----------------------------
            // حفظ البيانات
            // -----------------------------

            const savedCars =
                getSavedCars();


            const carIndex =
                savedCars.findIndex(
                    function(car) {

                        return car.id === editCarId;

                    }
                );


            if (carIndex === -1) {

                alert(
                    "لم يتم العثور على السيارة"
                );

                return;

            }


            savedCars[carIndex] =
                carToEdit;


            try {

                localStorage.setItem(
                    "eliteCars",
                    JSON.stringify(
                        savedCars
                    )
                );

            }

            catch (error) {

                alert(
                    "لم يتم حفظ التعديلات. حجم الصور كبير جدًا."
                );

                console.error(error);

                return;

            }


            alert(
                "تم حفظ تعديلات السيارة بنجاح ✅"
            );


            window.location.href =
                "admin.html";

        }
    );

}