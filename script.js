// =====================================
// السيارات المحفوظة
// =====================================

function getSavedCars() {

    return JSON.parse(
        localStorage.getItem("eliteCars")
    ) || [];

}


// =====================================
// جميع السيارات من قاعدة D1
// =====================================

let allOnlineCars = [];


async function getAllCars() {

    try {

        const response = await fetch("/api/cars");

        const data = await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "فشل جلب السيارات"
            );

        }


        return data.cars || [];

    }

    catch (error) {

        console.error(
            "خطأ أثناء جلب السيارات:",
            error
        );

        return [];

    }

}


function getMainImage(car) {

    if (
        car.images &&
        car.images.length > 0
    ) {

        return car.images[0];

    }


    if (car.main_image) {

        return car.main_image;

    }


    if (car.image) {

        return car.image;

    }


    return "";

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
// عرض السيارات
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


    carsToDisplay.forEach(
        function(car) {

            const card =
                document.createElement(
                    "div"
                );


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
                        ${car.body_type || car.type || ""}
                        •
                        ${car.brand}
                    </p>

                    <p
                        class="
                            car-status
                            ${getStatusClass(
                                car.status
                            )}
                        "
                    >
                        الحالة:
                        ${car.status || "متوفرة"}
                    </p>

                    <strong>
                        $${Number(
                            car.price || 0
                        ).toLocaleString()}
                    </strong>

                    <button
                        onclick="
                            openCarDetails(
                                '${car.id}'
                            )
                        "
                    >
                        عرض التفاصيل
                    </button>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

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
            .trim()
            .toLowerCase();


    const brandValue =
        brandElement.value;


    const yearValue =
        yearElement.value;


    const typeValue =
        typeElement.value;


    const results =
        allOnlineCars.filter(
            function(car) {

                const carName =
                    (car.name || "")
                        .toLowerCase();


                const carBrand =
                    car.brand || "";


                const carYear =
                    String(
                        car.year || ""
                    );


                const carType =
                    car.body_type ||
                    car.type ||
                    "";


                const matchesSearch =
                    carName.includes(
                        searchValue
                    );


                const matchesBrand =
                    brandValue === "" ||
                    carBrand ===
                        brandValue;


                const matchesYear =
                    yearValue === "" ||
                    carYear ===
                        yearValue;


                const matchesType =
                    typeValue === "" ||
                    carType ===
                        typeValue;


                return (
                    matchesSearch &&
                    matchesBrand &&
                    matchesYear &&
                    matchesType
                );

            }
        );


    displayCars(
        results
    );

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
// تحميل السيارات من D1
// =====================================

async function loadCarsFromServer() {

    allOnlineCars =
        await getAllCars();


    if (
        document.getElementById(
            "carsContainer"
        )
    ) {

        displayCars(
            allOnlineCars
        );

    }


    if (
        document.getElementById(
            "adminCarsContainer"
        )
    ) {

        displayAdminCars(
            allOnlineCars
        );

    }


    updateOnlineCarCounts();

}


loadCarsFromServer();


// =====================================
// صفحة تفاصيل السيارة
// =====================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const carId =
    urlParams.get(
        "car"
    );


async function loadCarDetails() {

    if (!carId) {

        return;

    }


    const allCars =
        await getAllCars();


    const selectedCar =
        allCars.find(
            function(car) {

                return (
                    String(car.id) ===
                    String(carId)
                );

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
            selectedCar.name || "";


        document.getElementById(
            "carPrice"
        ).textContent =
            "$" +
            Number(
                selectedCar.price || 0
            ).toLocaleString();


        document.getElementById(
            "carYear"
        ).textContent =
            selectedCar.year || "-";


        document.getElementById(
            "carBrand"
        ).textContent =
            selectedCar.brand || "-";


        document.getElementById(
            "carModel"
        ).textContent =
            selectedCar.model || "-";


        document.getElementById(
            "carType"
        ).textContent =
            selectedCar.body_type ||
            selectedCar.type ||
            "-";


        document.getElementById(
            "carEngine"
        ).textContent =
            selectedCar.engine ||
            "-";


        document.getElementById(
            "carTransmission"
        ).textContent =
            selectedCar.transmission ||
            "-";


        const descriptionElement =
            document.getElementById(
                "carDescription"
            );


        if (descriptionElement) {

            descriptionElement.textContent =
                selectedCar.description ||
                "سيارة مختارة من رؤية النخبة للسيارات.";

        }


        const statusElement =
            document.getElementById(
                "carStatus"
            );


        if (statusElement) {

            const status =
                selectedCar.status ||
                "متوفرة";


            statusElement.textContent =
                status;


            statusElement.classList.add(
                getStatusClass(
                    status
                )
            );

        }


        // =====================================
        // صور السيارة
        // =====================================

        let carImages = [];


        if (
            selectedCar.images &&
            selectedCar.images.length > 0
        ) {

            carImages =
                selectedCar.images;

        }

        else if (
            selectedCar.main_image
        ) {

            carImages = [
                selectedCar.main_image
            ];

        }

        else if (
            selectedCar.image
        ) {

            carImages = [
                selectedCar.image
            ];

        }


        const mainImage =
            document.getElementById(
                "carImage"
            );


        let currentImageIndex = 0;


        const prevImageButton =
            document.getElementById(
                "prevImageButton"
            );


        const nextImageButton =
            document.getElementById(
                "nextImageButton"
            );


        function showCarImage(index) {

            if (
                !mainImage ||
                carImages.length === 0
            ) {

                return;

            }


            if (
                index >=
                carImages.length
            ) {

                index = 0;

            }


            if (
                index < 0
            ) {

                index =
                    carImages.length - 1;

            }


            currentImageIndex =
                index;


            mainImage.src =
                carImages[
                    currentImageIndex
                ];


            const thumbnails =
                document.querySelectorAll(
                    ".car-thumbnail"
                );


            thumbnails.forEach(
                function(thumbnail) {

                    thumbnail
                        .classList
                        .remove(
                            "active"
                        );

                }
            );


            if (
                thumbnails[
                    currentImageIndex
                ]
            ) {

                thumbnails[
                    currentImageIndex
                ].classList.add(
                    "active"
                );

            }

        }


        if (prevImageButton) {

            prevImageButton
                .addEventListener(
                    "click",
                    function(event) {

                        event
                            .preventDefault();


                        showCarImage(
                            currentImageIndex -
                            1
                        );

                    }
                );

        }


        if (nextImageButton) {

            nextImageButton
                .addEventListener(
                    "click",
                    function(event) {

                        event
                            .preventDefault();


                        showCarImage(
                            currentImageIndex +
                            1
                        );

                    }
                );

        }


        const thumbnails =
            document.getElementById(
                "carThumbnails"
            );


        if (
            mainImage &&
            carImages.length > 0
        ) {

            mainImage.src =
                carImages[0];


            mainImage.alt =
                selectedCar.name;

        }


        if (thumbnails) {

            thumbnails.innerHTML =
                "";


            carImages.forEach(
                function(
                    image,
                    index
                ) {

                    const thumbnail =
                        document
                            .createElement(
                                "div"
                            );


                    thumbnail.className =
                        "car-thumbnail";


                    if (
                        index === 0
                    ) {

                        thumbnail
                            .classList
                            .add(
                                "active"
                            );

                    }


                    thumbnail.innerHTML = `
                        <img
                            src="${image}"
                            alt="${selectedCar.name}"
                        >
                    `;


                    thumbnail
                        .addEventListener(
                            "click",
                            function() {

                                showCarImage(
                                    index
                                );

                            }
                        );


                    thumbnails
                        .appendChild(
                            thumbnail
                        );

                }
            );

        }

    }

    else {

        const detailsPage =
            document.querySelector(
                ".car-details-page"
            );


        if (detailsPage) {

            detailsPage.innerHTML = `

                <div
                    class="container"
                    style="
                        text-align:center;
                        padding:100px 20px;
                    "
                >

                    <h1>
                        السيارة غير موجودة
                    </h1>

                    <p>
                        ربما تم حذف السيارة أو تغير رابطها.
                    </p>

                    <a
                        href="cars.html"
                        class="
                            hero-button
                            primary-button
                        "
                    >
                        العودة إلى معرض السيارات
                    </a>

                </div>

            `;

        }

    }

}


if (carId) {

    loadCarDetails();

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
        !carsToDisplay ||
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
                    alt="${car.name || ""}"
                >


                <div class="admin-car-info">

                    <h3>
                        ${car.name || ""}
                    </h3>


                    <p>
                        ${car.year || ""}
                        •
                        ${car.brand || ""}
                        •
                        ${car.body_type || car.type || ""}
                    </p>


                    <strong>
                        $${Number(
                            car.price || 0
                        ).toLocaleString()}
                    </strong>


                    <p>
                        الحالة:
                        <b>
                            ${car.status || "متوفرة"}
                        </b>
                    </p>


                    <div class="admin-buttons">

                        <button
                            type="button"
                            onclick="editCar('${car.id}')"
                        >
                            ✏️ تعديل
                        </button>


                        <button
                            type="button"
                            onclick="deleteCar('${car.id}')"
                        >
                            🗑️ حذف
                        </button>


                        <button
                            type="button"
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
                    .trim()
                    .toLowerCase();


            const results =
                allOnlineCars.filter(
                    function(car) {

                        const name =
                            String(
                                car.name || ""
                            ).toLowerCase();


                        const brand =
                            String(
                                car.brand || ""
                            ).toLowerCase();


                        const model =
                            String(
                                car.model || ""
                            ).toLowerCase();


                        const year =
                            String(
                                car.year || ""
                            ).toLowerCase();


                        const vin =
                            String(
                                car.vin || ""
                            ).toLowerCase();


                        return (
                            name.includes(value) ||
                            brand.includes(value) ||
                            model.includes(value) ||
                            year.includes(value) ||
                            vin.includes(value)
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
// حذف السيارة من D1 و R2
// =====================================

async function deleteCar(carId) {

    const confirmed =
        confirm(
            "هل أنت متأكد من حذف هذه السيارة نهائيًا؟\n\n" +
            "سيتم حذف بيانات السيارة وصورها."
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/cars?id=${encodeURIComponent(carId)}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "لم يتم حذف السيارة"
            );

        }


        // إعادة جلب السيارات من D1
        allOnlineCars =
            await getAllCars();


        // تحديث لوحة الإدارة
        displayAdminCars(
            allOnlineCars
        );


        // تحديث الإحصائيات
        updateOnlineCarCounts();


        alert(
            "تم حذف السيارة بنجاح 🗑️"
        );

    }

    catch (error) {

        console.error(
            "خطأ حذف السيارة:",
            error
        );


        alert(
            "حدث خطأ أثناء حذف السيارة:\n" +
            error.message
        );

    }

}


// =====================================
// تغيير حالة السيارة في D1
// =====================================

async function changeCarStatus(carId) {

    const newStatus =
        prompt(
            "اكتب حالة السيارة الجديدة:\n\n" +
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
            "استخدم فقط:\n" +
            "متوفرة\n" +
            "محجوزة\n" +
            "مباعة"
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/cars",
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            id:
                                Number(carId),

                            status:
                                status
                        })
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.message ||
                "فشل تغيير حالة السيارة"
            );

        }


        // إعادة جلب السيارات من D1
        allOnlineCars =
            await getAllCars();


        // تحديث لوحة الإدارة
        displayAdminCars(
            allOnlineCars
        );


        // تحديث الإحصائيات
        updateOnlineCarCounts();


        alert(
            "تم تغيير حالة السيارة إلى: " +
            status +
            " ✅"
        );

    }

    catch (error) {

        console.error(
            "خطأ تغيير الحالة:",
            error
        );


        alert(
            "حدث خطأ أثناء تغيير حالة السيارة:\n" +
            error.message
        );

    }

}


// =====================================
// الانتقال إلى صفحة تعديل السيارة
// =====================================

function editCar(carId) {

    window.location.href =
        "edit-car.html?car=" +
        encodeURIComponent(carId);

}


// =====================================
// قراءة ID السيارة المطلوب تعديلها
// =====================================

const editParams =
    new URLSearchParams(
        window.location.search
    );


const editCarId =
    editParams.get(
        "car"
    );


// =====================================
// السيارة التي سيتم تعديلها
// =====================================

let carToEdit = null;


// =====================================
// الصور الجديدة المختارة
// سنستخدمها لاحقًا عند تطوير تعديل الصور
// =====================================

let editSelectedImages = [];


// =====================================
// تحميل بيانات السيارة من D1
// =====================================

async function loadEditCarData() {

    const editForm =
        document.getElementById(
            "editCarForm"
        );


    if (
        !editCarId ||
        !editForm
    ) {

        return;

    }


    try {

        const cars =
            await getAllCars();


        carToEdit =
            cars.find(
                function(car) {

                    return (
                        String(car.id) ===
                        String(editCarId)
                    );

                }
            );


        if (!carToEdit) {

            alert(
                "السيارة غير موجودة"
            );


            window.location.href =
                "admin.html";


            return;

        }


        // =====================================
        // الاسم
        // =====================================

        const nameInput =
            document.getElementById(
                "editCarName"
            );


        if (nameInput) {

            nameInput.value =
                carToEdit.name || "";

        }


        // =====================================
        // الماركة
        // =====================================

        const brandInput =
            document.getElementById(
                "editCarBrand"
            );


        if (brandInput) {

            brandInput.value =
                carToEdit.brand || "";

        }


        // =====================================
        // الموديل
        // =====================================

        const modelInput =
            document.getElementById(
                "editCarModel"
            );


        if (modelInput) {

            modelInput.value =
                carToEdit.model || "";

        }


        // =====================================
        // السنة
        // =====================================

        const yearInput =
            document.getElementById(
                "editCarYear"
            );


        if (yearInput) {

            yearInput.value =
                carToEdit.year || "";

        }


        // =====================================
        // نوع الهيكل
        // =====================================

        const typeInput =
            document.getElementById(
                "editCarType"
            );


        if (typeInput) {

            typeInput.value =
                carToEdit.body_type ||
                carToEdit.type ||
                "SUV";

        }


        // =====================================
        // المحرك
        // =====================================

        const engineInput =
            document.getElementById(
                "editCarEngine"
            );


        if (engineInput) {

            engineInput.value =
                carToEdit.engine || "";

        }


        // =====================================
        // ناقل الحركة
        // =====================================

        const transmissionInput =
            document.getElementById(
                "editCarTransmission"
            );


        if (transmissionInput) {

            transmissionInput.value =
                carToEdit.transmission ||
                "";

        }


        // =====================================
        // السعر
        // =====================================

        const priceInput =
            document.getElementById(
                "editCarPrice"
            );


        if (priceInput) {

            priceInput.value =
                carToEdit.price ?? "";

        }


        // =====================================
        // الوصف
        // =====================================

        const descriptionInput =
            document.getElementById(
                "editCarDescription"
            );


        if (descriptionInput) {

            descriptionInput.value =
                carToEdit.description ||
                "";

        }


        // =====================================
        // عرض الصور الحالية
        // =====================================

        showCurrentEditImages();

    }

    catch (error) {

        console.error(
            "خطأ تحميل السيارة:",
            error
        );


        alert(
            "حدث خطأ أثناء تحميل بيانات السيارة:\n" +
            error.message
        );

    }

}


// تشغيل تحميل بيانات السيارة
loadEditCarData();


// =====================================
// الحصول على صور السيارة
// =====================================

function getCarImages(car) {

    if (!car) {
        return [];
    }


    if (
        Array.isArray(
            car.images
        ) &&
        car.images.length > 0
    ) {

        return car.images;

    }


    if (car.main_image) {

        return [
            car.main_image
        ];

    }


    if (car.image) {

        return [
            car.image
        ];

    }


    return [];

}


// =====================================
// عرض الصور الحالية في صفحة التعديل
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
        getCarImages(
            carToEdit
        );


    preview.innerHTML = "";


    if (
        images.length === 0
    ) {

        preview.innerHTML = `
            <p>
                لا توجد صور لهذه السيارة
            </p>
        `;

        return;

    }


    images.forEach(
        function(
            image,
            index
        ) {

            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "preview-image-box";


            box.innerHTML = `

                <img
                    src="${image}"
                    alt="${carToEdit.name || "السيارة"}"
                >

                ${
                    index === 0
                    ?
                    `
                        <span
                            class="main-image-label"
                        >
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
// اختيار صور جديدة في صفحة التعديل
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

                showCurrentEditImages();

                return;

            }


            let loadedImages = 0;


            files.forEach(
                function(
                    file,
                    index
                ) {

                    const reader =
                        new FileReader();


                    reader.onload =
                        function(event) {

                            editSelectedImages[
                                index
                            ] =
                                event.target.result;


                            loadedImages++;


                            if (
                                loadedImages ===
                                files.length
                            ) {

                                showNewEditImages();

                            }

                        };


                    reader.readAsDataURL(
                        file
                    );

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
        function(
            image,
            index
        ) {

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
                        <span
                            class="main-image-label"
                        >
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
// حفظ تعديلات السيارة في D1
// =====================================

const editCarForm =
    document.getElementById(
        "editCarForm"
    );


if (editCarForm) {

    editCarForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!carToEdit) {

                alert(
                    "السيارة غير موجودة"
                );

                return;

            }


            try {

                // =====================================
                // قراءة البيانات من النموذج
                // =====================================

                const name =
                    document.getElementById(
                        "editCarName"
                    ).value.trim();


                const brand =
                    document.getElementById(
                        "editCarBrand"
                    ).value.trim();


                const model =
                    document.getElementById(
                        "editCarModel"
                    ).value.trim();


                const year =
                    Number(
                        document.getElementById(
                            "editCarYear"
                        ).value
                    );


                const bodyType =
                    document.getElementById(
                        "editCarType"
                    ).value;


                const engine =
                    document.getElementById(
                        "editCarEngine"
                    ).value.trim();


                const transmission =
                    document.getElementById(
                        "editCarTransmission"
                    ).value.trim();


                const price =
                    Number(
                        document.getElementById(
                            "editCarPrice"
                        ).value
                    );


                const description =
                    document.getElementById(
                        "editCarDescription"
                    ).value.trim();


                // =====================================
                // التحقق من البيانات الأساسية
                // =====================================

                if (
                    !name ||
                    !brand ||
                    !model
                ) {

                    alert(
                        "يرجى ملء الاسم والماركة والموديل"
                    );

                    return;

                }


                if (
                    !Number.isFinite(year) ||
                    year <= 0
                ) {

                    alert(
                        "يرجى إدخال سنة صحيحة"
                    );

                    return;

                }


                if (
                    !Number.isFinite(price) ||
                    price < 0
                ) {

                    alert(
                        "يرجى إدخال سعر صحيح"
                    );

                    return;

                }


                // =====================================
                // تجهيز بيانات السيارة
                // =====================================

                const updatedCar = {

                    id:
                        Number(
                            editCarId
                        ),

                    name:
                        name,

                    brand:
                        brand,

                    model:
                        model,

                    year:
                        year,

                    body_type:
                        bodyType,

                    engine:
                        engine,

                    transmission:
                        transmission,

                    price:
                        price,

                    description:
                        description,


                    // =================================
                    // المحافظة على البيانات غير الموجودة
                    // حاليًا في صفحة edit-car.html
                    // =================================

                    vin:
                        carToEdit.vin ??
                        null,

                    mileage:
                        carToEdit.mileage ??
                        null,

                    color:
                        carToEdit.color ??
                        null,

                    fuel_type:
                        carToEdit.fuel_type ??
                        null,

                    status:
                        carToEdit.status ||
                        "متوفرة",

                    main_image:
                        carToEdit.main_image ??
                        null

                };


                // =====================================
                // إرسال التعديل إلى Cloudflare API
                // =====================================

                const response =
                    await fetch(
                        "/api/cars",
                        {

                            method:
                                "PUT",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    updatedCar
                                )

                        }
                    );


                const result =
                    await response.json();


                if (
                    !response.ok ||
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "فشل حفظ التعديلات"
                    );

                }


                // =====================================
                // النجاح
                // =====================================

                alert(
                    "تم حفظ تعديلات السيارة بنجاح ✅"
                );


                window.location.href =
                    "admin.html";

            }

            catch (error) {

                console.error(
                    "خطأ حفظ التعديلات:",
                    error
                );


                alert(
                    "حدث خطأ أثناء حفظ التعديلات:\n" +
                    error.message
                );

            }

        }
    );

}


// =====================================
// الصفحة الرئيسية الجديدة
// =====================================

const heroSlides =
    document.querySelectorAll(
        ".hero-slide"
    );


const heroDots =
    document.querySelectorAll(
        ".hero-dot"
    );


let currentHeroSlide = 0;

let heroTimer;


// =====================================
// تغيير صورة الواجهة
// =====================================

function showHeroSlide(index) {

    if (
        heroSlides.length === 0
    ) {

        return;

    }


    heroSlides.forEach(
        function(slide) {

            slide.classList.remove(
                "active"
            );

        }
    );


    heroDots.forEach(
        function(dot) {

            dot.classList.remove(
                "active"
            );

        }
    );


    heroSlides[
        index
    ].classList.add(
        "active"
    );


    if (
        heroDots[
            index
        ]
    ) {

        heroDots[
            index
        ].classList.add(
            "active"
        );

    }


    currentHeroSlide =
        index;

}


// =====================================
// تشغيل التغيير التلقائي
// =====================================

function startHeroSlider() {

    if (
        heroSlides.length <= 1
    ) {

        return;

    }


    clearInterval(
        heroTimer
    );


    heroTimer =
        setInterval(
            function() {

                let nextSlide =
                    currentHeroSlide +
                    1;


                if (
                    nextSlide >=
                    heroSlides.length
                ) {

                    nextSlide = 0;

                }


                showHeroSlide(
                    nextSlide
                );

            },
            5000
        );

}


heroDots.forEach(
    function(dot) {

        dot.addEventListener(
            "click",
            function() {

                const slideIndex =
                    Number(
                        dot.dataset.slide
                    );


                showHeroSlide(
                    slideIndex
                );


                startHeroSlider();

            }
        );

    }
);


startHeroSlider();


// =====================================
// قائمة الهاتف
// =====================================

const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );


const mainNav =
    document.querySelector(
        ".main-nav"
    );


if (
    mobileMenuButton &&
    mainNav
) {

    mobileMenuButton.addEventListener(
        "click",
        function() {

            mainNav.classList.toggle(
                "open"
            );

        }
    );


    mainNav
        .querySelectorAll(
            "a"
        )
        .forEach(
            function(link) {

                link.addEventListener(
                    "click",
                    function() {

                        mainNav
                            .classList
                            .remove(
                                "open"
                            );

                    }
                );

            }
        );

}


// =====================================
// تحديث أعداد السيارات والإحصائيات
// =====================================

function updateOnlineCarCounts() {

    const homeCarsCount =
        document.getElementById(
            "homeCarsCount"
        );


    if (homeCarsCount) {

        homeCarsCount.textContent =
            "+" +
            allOnlineCars.length;

    }


    const carsPageCount =
        document.getElementById(
            "carsPageCount"
        );


    if (carsPageCount) {

        carsPageCount.textContent =
            allOnlineCars.length;

    }


    updateAdminStats();

}


// =====================================
// إحصائيات لوحة الإدارة
// =====================================

function updateAdminStats() {

    const totalElement =
        document.getElementById(
            "adminTotalCars"
        );


    if (!totalElement) {

        return;

    }


    const availableCars =
        allOnlineCars.filter(
            function(car) {

                return (
                    car.status ||
                    "متوفرة"
                ) ===
                    "متوفرة";

            }
        );


    const reservedCars =
        allOnlineCars.filter(
            function(car) {

                return (
                    car.status ===
                    "محجوزة"
                );

            }
        );


    const soldCars =
        allOnlineCars.filter(
            function(car) {

                return (
                    car.status ===
                    "مباعة"
                );

            }
        );


    totalElement.textContent =
        allOnlineCars.length;


    const availableElement =
        document.getElementById(
            "adminAvailableCars"
        );


    if (availableElement) {

        availableElement.textContent =
            availableCars.length;

    }


    const reservedElement =
        document.getElementById(
            "adminReservedCars"
        );


    if (reservedElement) {

        reservedElement.textContent =
            reservedCars.length;

    }


    const soldElement =
        document.getElementById(
            "adminSoldCars"
        );


    if (soldElement) {

        soldElement.textContent =
            soldCars.length;

    }

}
