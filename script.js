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

    // =====================================
    // 1- الصورة الرئيسية المحفوظة في D1
    // =====================================

    if (
        car &&
        car.main_image
    ) {

        return car.main_image;

    }


    // =====================================
    // 2- البحث عن is_main داخل سجلات الصور
    // =====================================

    if (
        car &&
        Array.isArray(car.image_records)
    ) {

        const selectedMainImage =
            car.image_records.find(
                function(image) {

                    return (
                        Number(image.is_main) === 1 &&
                        image.image_url
                    );

                }
            );


        if (selectedMainImage) {

            return selectedMainImage.image_url;

        }

    }


    // =====================================
    // 3- إذا لم توجد رئيسية نستخدم أول صورة
    // =====================================

    if (
        car &&
        Array.isArray(car.images) &&
        car.images.length > 0
    ) {

        return car.images[0];

    }


    // =====================================
    // 4- دعم البيانات القديمة
    // =====================================

    if (
        car &&
        car.image
    ) {

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
// لون حالة السيارة
// =====================================

function getStatusClass(status) {

    if (status === "مباعة") {
        return "status-sold";
    }

    if (status === "محجوزة") {
        return "status-reserved";
    }

    if (status === "في الطريق") {
        return "status-in-transit";
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

${
    car.status === "في الطريق"
    ? `
        <p class="port-price-note">
            🚢 السعر المذكور إلى الميناء
        </p>
    `
    : ""
}

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
        // =====================================
// ملاحظة السعر للسيارات التي في الطريق
// =====================================

const portPriceNote =
    document.getElementById(
        "portPriceNote"
    );

if (portPriceNote) {

    if (
        selectedCar.status ===
        "في الطريق"
    ) {

        portPriceNote.textContent =
            "🚢 السعر المذكور إلى الميناء";

        portPriceNote.style.display =
            "block";

    }

    else {

        portPriceNote.textContent =
            "";

        portPriceNote.style.display =
            "none";

    }

}


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
// =====================================
// رقم الشاصي VIN
// =====================================

const vinElement =
    document.getElementById(
        "carVin"
    );

if (vinElement) {

    vinElement.textContent =
        selectedCar.vin ||
        "-";

}


// =====================================
// العداد
// =====================================

const mileageElement =
    document.getElementById(
        "carMileage"
    );

if (mileageElement) {

    if (
        selectedCar.mileage !== null &&
        selectedCar.mileage !== undefined &&
        selectedCar.mileage !== ""
    ) {

        mileageElement.textContent =
            Number(
                selectedCar.mileage
            ).toLocaleString() +
            " ميل";

    }

    else {

        mileageElement.textContent =
            "-";

    }

}


// =====================================
// اللون
// =====================================

const colorElement =
    document.getElementById(
        "carColor"
    );

if (colorElement) {

    colorElement.textContent =
        selectedCar.color ||
        "-";

}


// =====================================
// نوع الوقود
// =====================================

const fuelElement =
    document.getElementById(
        "carFuel"
    );

if (fuelElement) {

    fuelElement.textContent =
        selectedCar.fuel_type ||
        "-";

}


// =====================================
// حالة السيارة داخل المواصفات
// =====================================

const statusTextElement =
    document.getElementById(
        "carStatusText"
    );

if (statusTextElement) {

    statusTextElement.textContent =
        selectedCar.status ||
        "متوفرة";

}

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
        ".modern-car-details-section"
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
        "في الطريق\n" +
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
    "في الطريق",
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
    "في الطريق\n" +
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
// الصورة الرئيسية المختارة أثناء التعديل
// =====================================

let selectedEditMainImage = null;

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
        // اسم السيارة
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
                carToEdit.year ?? "";

        }


        // =====================================
        // VIN رقم الشاصي
        // =====================================

        const vinInput =
            document.getElementById(
                "editCarVin"
            );

        if (vinInput) {

            vinInput.value =
                carToEdit.vin || "";

        }


        // =====================================
        // العداد
        // =====================================

        const mileageInput =
            document.getElementById(
                "editCarMileage"
            );

        if (mileageInput) {

            mileageInput.value =
                carToEdit.mileage ?? "";

        }


        // =====================================
        // اللون
        // =====================================

        const colorInput =
            document.getElementById(
                "editCarColor"
            );

        if (colorInput) {

            colorInput.value =
                carToEdit.color || "";

        }


        // =====================================
        // الوقود
        // =====================================

        const fuelInput =
            document.getElementById(
                "editCarFuel"
            );

        if (fuelInput) {

            fuelInput.value =
                carToEdit.fuel_type || "";

        }


        // =====================================
        // نوع السيارة
        // =====================================

        const typeInput =
            document.getElementById(
                "editCarType"
            );

        if (typeInput) {

            typeInput.value =
                carToEdit.body_type || "";

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
                carToEdit.transmission || "";

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
        // حالة السيارة
        // =====================================

        const statusInput =
            document.getElementById(
                "editCarStatus"
            );

        if (statusInput) {

            statusInput.value =
                carToEdit.status ||
                "متوفرة";

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
                carToEdit.description || "";

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


    // =====================================
    // الحصول على صور السيارة
    // =====================================

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

        selectedEditMainImage = null;

        return;

    }


    // =====================================
    // تحديد الصورة الرئيسية الحالية
    // =====================================

    if (!selectedEditMainImage) {

        if (carToEdit.main_image) {

            selectedEditMainImage =
                carToEdit.main_image;

        }

        else if (
            Array.isArray(
                carToEdit.image_records
            )
        ) {

            const mainRecord =
                carToEdit.image_records.find(
                    function(record) {

                        return (
                            Number(
                                record.is_main
                            ) === 1
                        );

                    }
                );


            if (
                mainRecord &&
                mainRecord.image_url
            ) {

                selectedEditMainImage =
                    mainRecord.image_url;

            }

        }


        // إذا لم تكن هناك رئيسية محفوظة
        // نستخدم أول صورة كاحتياط

        if (!selectedEditMainImage) {

            selectedEditMainImage =
                images[0];

        }

    }


    // =====================================
    // عرض الصور
    // =====================================

    images.forEach(
        function(
            image,
            index
        ) {

            const box =
                document.createElement(
                    "div"
                );


            const isMain =
                image ===
                selectedEditMainImage;


            box.className =
                "preview-image-box" +
                (
                    isMain
                    ? " selected-main-image"
                    : ""
                );


            box.innerHTML = `

                <img
                    src="${image}"
                    alt="${carToEdit.name || "السيارة"}"
                >

                ${
                    isMain
                    ?
                    `
                        <span
                            class="main-image-label"
                        >
                            ⭐ الصورة الرئيسية
                        </span>
                    `
                    :
                    `
                        <button
                            type="button"
                            class="select-main-image-button"
                        >
                            اجعلها الرئيسية
                        </button>
                    `
                }

            `;


            // =====================================
            // اختيار الصورة الرئيسية
            // =====================================

            box.addEventListener(
                "click",
                function() {

                    selectedEditMainImage =
                        image;


                    showCurrentEditImages();

                }
            );


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
                    editImagesInput.files || []
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
                    `
                        <span
                            class="image-number"
                        >
                            صورة ${index + 1}
                        </span>
                    `
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


            // =====================================
            // الصور الجديدة غير مفعلة في الحفظ بعد
            // =====================================

            if (
                editImagesInput &&
                editImagesInput.files &&
                editImagesInput.files.length > 0
            ) {

                alert(
                    "تعديل الصور سنفعّله في الخطوة التالية.\n\nاحذف اختيار الصور الجديدة ثم احفظ بيانات السيارة."
                );

                return;

            }


            try {

                // =====================================
                // قراءة الحقول
                // =====================================

                const name =
                    document
                        .getElementById(
                            "editCarName"
                        )
                        .value
                        .trim();


                const brand =
                    document
                        .getElementById(
                            "editCarBrand"
                        )
                        .value
                        .trim();


                const model =
                    document
                        .getElementById(
                            "editCarModel"
                        )
                        .value
                        .trim();


                const year =
                    Number(
                        document
                            .getElementById(
                                "editCarYear"
                            )
                            .value
                    );


                const vin =
                    document
                        .getElementById(
                            "editCarVin"
                        )
                        .value
                        .trim()
                        .toUpperCase();


                const mileageValue =
                    document
                        .getElementById(
                            "editCarMileage"
                        )
                        .value;


                const mileage =
                    mileageValue !== ""
                    ? Number(mileageValue)
                    : null;


                const color =
                    document
                        .getElementById(
                            "editCarColor"
                        )
                        .value
                        .trim();


                const fuelType =
                    document
                        .getElementById(
                            "editCarFuel"
                        )
                        .value;


                const bodyType =
                    document
                        .getElementById(
                            "editCarType"
                        )
                        .value;


                const engine =
                    document
                        .getElementById(
                            "editCarEngine"
                        )
                        .value
                        .trim();


                const transmission =
                    document
                        .getElementById(
                            "editCarTransmission"
                        )
                        .value
                        .trim();


                const price =
                    Number(
                        document
                            .getElementById(
                                "editCarPrice"
                            )
                            .value
                    );


                const status =
                    document
                        .getElementById(
                            "editCarStatus"
                        )
                        .value;


                const description =
                    document
                        .getElementById(
                            "editCarDescription"
                        )
                        .value
                        .trim();


                // =====================================
                // التحقق من البيانات
                // =====================================

                if (
                    !name ||
                    !brand ||
                    !model
                ) {

                    alert(
                        "يرجى إدخال اسم السيارة والماركة والموديل"
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


                if (
                    mileage !== null &&
                    (
                        !Number.isFinite(mileage) ||
                        mileage < 0
                    )
                ) {

                    alert(
                        "يرجى إدخال عداد صحيح"
                    );

                    return;

                }


                // =====================================
                // تجهيز البيانات لإرسالها إلى D1
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

                    vin:
                        vin || null,

                    mileage:
                        mileage,

                    color:
                        color || null,

                    fuel_type:
                        fuelType || null,

                    body_type:
                        bodyType || null,

                    engine:
                        engine || null,

                    transmission:
                        transmission || null,

                    price:
                        price,

                    status:
                        status,

                    description:
                        description || null,

                   main_image:
    selectedEditMainImage ||
    carToEdit.main_image ||
    null


                // =====================================
                // إرسال التعديل إلى API
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
                        "فشل حفظ تعديلات السيارة"
                    );

                }


                alert(
                    "تم حفظ تعديلات السيارة بنجاح ✅"
                );


                window.location.href =
                    "admin.html";

            }

            catch (error) {

                console.error(
                    "خطأ حفظ تعديلات السيارة:",
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
