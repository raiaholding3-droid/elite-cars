// ==========================================
// إضافة سيارة إلى D1 + رفع الصور إلى R2
// ==========================================

const onlineAddCarForm =
    document.getElementById(
        "onlineAddCarForm"
    );

const addCarMessage =
    document.getElementById(
        "addCarMessage"
    );

const saveCarButton =
    document.getElementById(
        "saveCarButton"
    );

const newCarImages =
    document.getElementById(
        "newCarImages"
    );

const newCarImagesPreview =
    document.getElementById(
        "newCarImagesPreview"
    );


// ==========================================
// الصور المختارة
// ==========================================

let selectedCarFiles = [];

let selectedMainImageIndex = 0;


// ==========================================
// اختيار الصور
// ==========================================

if (newCarImages) {

    newCarImages.addEventListener(
        "change",
        function() {

            selectedCarFiles =
                Array.from(
                    newCarImages.files
                );

            selectedMainImageIndex = 0;

            showSelectedImages();

        }
    );

}


// ==========================================
// عرض معاينة الصور
// ==========================================

function showSelectedImages() {

    if (!newCarImagesPreview) {
        return;
    }


    newCarImagesPreview.innerHTML = "";


    if (
        selectedCarFiles.length === 0
    ) {

        return;

    }


    selectedCarFiles.forEach(
        function(file, index) {

            const imageUrl =
                URL.createObjectURL(
                    file
                );


            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "preview-image-box";


            if (
                index ===
                selectedMainImageIndex
            ) {

                box.classList.add(
                    "selected-main-image"
                );

            }


            box.innerHTML = `

                <img
                    src="${imageUrl}"
                    alt="صورة السيارة"
                >

                <button
                    type="button"
                    class="select-main-image-button"
                >
                    ${
                        index ===
                        selectedMainImageIndex

                        ? "⭐ الصورة الرئيسية"

                        : "اجعلها الرئيسية"
                    }
                </button>

            `;


            box.addEventListener(
                "click",
                function() {

                    selectedMainImageIndex =
                        index;

                    showSelectedImages();

                }
            );


            newCarImagesPreview
                .appendChild(
                    box
                );

        }
    );

}


// ==========================================
// إضافة السيارة
// ==========================================

if (onlineAddCarForm) {

    onlineAddCarForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            // ==================================
            // التأكد من اختيار صورة
            // ==================================

            if (
                selectedCarFiles.length === 0
            ) {

                alert(
                    "يرجى اختيار صورة واحدة على الأقل"
                );

                return;

            }


            // ==================================
            // تعطيل الزر أثناء الحفظ
            // ==================================

            if (saveCarButton) {

                saveCarButton.disabled =
                    true;

                saveCarButton.textContent =
                    "جاري حفظ السيارة...";

            }


            if (addCarMessage) {

                addCarMessage.textContent =
                    "جاري حفظ بيانات السيارة...";

            }


            // ==================================
            // قراءة البيانات
            // ==================================

            const carData = {

                name:
                    document
                        .getElementById(
                            "newCarName"
                        )
                        .value
                        .trim(),

                brand:
                    document
                        .getElementById(
                            "newCarBrand"
                        )
                        .value
                        .trim(),

                model:
                    document
                        .getElementById(
                            "newCarModel"
                        )
                        .value
                        .trim(),

                year:
                    Number(
                        document
                            .getElementById(
                                "newCarYear"
                            )
                            .value
                    ),

                vin:
                    document
                        .getElementById(
                            "newCarVin"
                        )
                        .value
                        .trim()
                        .toUpperCase(),

                mileage:
                    document
                        .getElementById(
                            "newCarMileage"
                        )
                        .value

                    ? Number(
                        document
                            .getElementById(
                                "newCarMileage"
                            )
                            .value
                    )

                    : null,

                color:
                    document
                        .getElementById(
                            "newCarColor"
                        )
                        .value
                        .trim(),

                fuel_type:
                    document
                        .getElementById(
                            "newCarFuel"
                        )
                        .value,

                body_type:
                    document
                        .getElementById(
                            "newCarBodyType"
                        )
                        .value,

                engine:
                    document
                        .getElementById(
                            "newCarEngine"
                        )
                        .value
                        .trim(),

                transmission:
                    document
                        .getElementById(
                            "newCarTransmission"
                        )
                        .value
                        .trim(),

                price:
                    Number(
                        document
                            .getElementById(
                                "newCarPrice"
                            )
                            .value
                    ),

                status:
                    document
                        .getElementById(
                            "newCarStatus"
                        )
                        .value,

                description:
                    document
                        .getElementById(
                            "newCarDescription"
                        )
                        .value
                        .trim(),

                main_image:
                    null

            };


            // ==================================
            // التحقق من البيانات الأساسية
            // ==================================

            if (
                !carData.name ||
                !carData.brand ||
                !carData.model
            ) {

                alert(
                    "يرجى إدخال اسم السيارة والماركة والموديل"
                );

                resetSaveButton();

                return;

            }


            if (
                !Number.isFinite(
                    carData.year
                ) ||
                carData.year <= 0
            ) {

                alert(
                    "يرجى إدخال سنة صحيحة"
                );

                resetSaveButton();

                return;

            }


            if (
                !Number.isFinite(
                    carData.price
                ) ||
                carData.price < 0
            ) {

                alert(
                    "يرجى إدخال سعر صحيح"
                );

                resetSaveButton();

                return;

            }


            try {

                // ==================================
                // 1- حفظ السيارة في D1
                // ==================================

                const carResponse =
                    await fetch(
                        "/api/cars",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    carData
                                )

                        }
                    );


                let carResult;


                try {

                    carResult =
                        await carResponse.json();

                }

                catch (jsonError) {

                    throw new Error(
                        "رد الخادم غير صالح أثناء حفظ السيارة"
                    );

                }


                if (
                    !carResponse.ok ||
                    !carResult.success
                ) {

                    throw new Error(
                        carResult.message ||
                        "فشل حفظ السيارة في قاعدة البيانات"
                    );

                }


                const carId =
                    carResult.id;


                if (!carId) {

                    throw new Error(
                        "تم حفظ الطلب ولكن لم يتم الحصول على رقم السيارة"
                    );

                }


                // ==================================
                // 2- رفع الصور إلى R2
                // ==================================

                for (
                    let i = 0;
                    i <
                    selectedCarFiles.length;
                    i++
                ) {

                    const file =
                        selectedCarFiles[i];


                    if (addCarMessage) {

                        addCarMessage.textContent =
                            `جاري رفع الصورة ${
                                i + 1
                            } من ${
                                selectedCarFiles.length
                            }...`;

                    }


                    if (saveCarButton) {

                        saveCarButton.textContent =
                            `رفع الصور ${
                                i + 1
                            } / ${
                                selectedCarFiles.length
                            }`;

                    }


                    const formData =
                        new FormData();


                    formData.append(
                        "image",
                        file
                    );


                    formData.append(
                        "carId",
                        String(
                            carId
                        )
                    );


                    formData.append(
                        "imageOrder",
                        String(
                            i
                        )
                    );


                    formData.append(
                        "isMain",
                        i ===
                        selectedMainImageIndex

                        ? "1"

                        : "0"
                    );


                    const uploadResponse =
                        await fetch(
                            "/api/upload-image",
                            {

                                method:
                                    "POST",

                                body:
                                    formData

                            }
                        );


                    let uploadResult;


                    try {

                        uploadResult =
                            await uploadResponse.json();

                    }

                    catch (jsonError) {

                        throw new Error(
                            `رد الخادم غير صالح أثناء رفع الصورة ${
                                i + 1
                            }`
                        );

                    }


                    if (
                        !uploadResponse.ok ||
                        !uploadResult.success
                    ) {

                        throw new Error(
                            uploadResult.message ||
                            `فشل رفع الصورة ${
                                i + 1
                            }`
                        );

                    }

                }


                // ==================================
                // نجاح العملية
                // ==================================

                if (addCarMessage) {

                    addCarMessage.textContent =
                        "تمت إضافة السيارة ورفع الصور بنجاح ✅";

                }


                if (saveCarButton) {

                    saveCarButton.textContent =
                        "تم الحفظ ✅";

                }


                onlineAddCarForm.reset();


                selectedCarFiles = [];

                selectedMainImageIndex = 0;


                if (
                    newCarImagesPreview
                ) {

                    newCarImagesPreview.innerHTML =
                        "";

                }


                setTimeout(
                    function() {

                        window.location.href =
                            "cars.html";

                    },
                    1200
                );

            }

            catch (error) {

                console.error(
                    "خطأ إضافة السيارة:",
                    error
                );


                if (addCarMessage) {

                    addCarMessage.textContent =
                        "حدث خطأ: " +
                        error.message;

                }


                alert(
                    "حدث خطأ:\n" +
                    error.message
                );


                resetSaveButton();

            }

        }
    );

}


// ==========================================
// إعادة زر الحفظ إلى حالته الطبيعية
// ==========================================

function resetSaveButton() {

    if (!saveCarButton) {
        return;
    }


    saveCarButton.disabled =
        false;


    saveCarButton.textContent =
        "حفظ السيارة";

}
