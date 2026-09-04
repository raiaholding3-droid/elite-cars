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


let selectedCarFiles = [];

let selectedMainImageIndex = 0;


// ==========================================
// معاينة الصور
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
           function showSelectedImages() {

    if (!newCarImagesPreview) {
        return;
    }


    newCarImagesPreview.innerHTML = "";


    selectedCarFiles.forEach(
        function(file, index) {

            const imageUrl =
                URL.createObjectURL(file);


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
                .appendChild(box);

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


    selectedCarFiles.forEach(
        function(file, index) {

            const imageUrl =
                URL.createObjectURL(file);


            const box =
                document.createElement(
                    "div"
                );


            box.className =
                "preview-image-box";


            box.innerHTML = `

                <img
                    src="${imageUrl}"
                    alt="صورة السيارة"
                >

                ${
                    index === 0

                    ? `
                        <span class="main-image-label">
                            ⭐ الصورة الرئيسية
                        </span>
                    `

                    : `
                        <span class="image-number">
                            صورة ${index + 1}
                        </span>
                    `
                }

            `;


            newCarImagesPreview
                .appendChild(box);

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


            // =================================
            // التأكد من وجود صورة
            // =================================

            if (
                selectedCarFiles.length === 0
            ) {

                alert(
                    "يرجى اختيار صورة واحدة على الأقل"
                );

                return;

            }


            saveCarButton.disabled = true;

            saveCarButton.textContent =
                "جاري حفظ السيارة...";


            if (addCarMessage) {

                addCarMessage.textContent =
                    "جاري حفظ بيانات السيارة...";

            }


            // =================================
            // بيانات السيارة
            // =================================

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


                main_image: null

            };


            try {

                // =================================
                // 1- إنشاء السيارة في D1
                // =================================

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


                const carResult =
                    await carResponse.json();


                if (
                    !carResponse.ok ||
                    !carResult.success
                ) {

                    throw new Error(
                        carResult.message ||
                        "فشل حفظ السيارة"
                    );

                }


                const carId =
                    carResult.id;


                if (!carId) {

                    throw new Error(
                        "لم يتم الحصول على رقم السيارة"
                    );

                }


                // =================================
                // 2- رفع الصور
                // =================================

                for (
                    let i = 0;
                    i < selectedCarFiles.length;
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


                    saveCarButton.textContent =
                        `رفع الصور ${
                            i + 1
                        } / ${
                            selectedCarFiles.length
                        }`;


                    const formData =
                        new FormData();


                    formData.append(
                        "image",
                        file
                    );


                    formData.append(
                        "carId",
                        carId
                    );


                    formData.append(
                        "imageOrder",
                        i
                    );
formData.append(
    "isMain",
    i === selectedMainImageIndex
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


                    const uploadResult =
                        await uploadResponse.json();


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


                // =================================
                // نجاح العملية كاملة
                // =================================

                if (addCarMessage) {

                    addCarMessage.textContent =
                        "تمت إضافة السيارة ورفع الصور بنجاح ✅";

                }


                saveCarButton.textContent =
                    "تم الحفظ ✅";


                onlineAddCarForm.reset();


                selectedCarFiles = [];


                if (newCarImagesPreview) {

                    newCarImagesPreview.innerHTML =
                        "";

                }


                setTimeout(
                    function() {

                        window.location.href =
                            "cars.html";

                    },
                    1500
                );

            }

            catch (error) {

                console.error(error);


                if (addCarMessage) {

                    addCarMessage.textContent =
                        "حدث خطأ: " +
                        error.message;

                }


                alert(
                    "حدث خطأ:\n" +
                    error.message
                );

            }

            finally {

                saveCarButton.disabled =
                    false;


                if (
                    saveCarButton.textContent !==
                    "تم الحفظ ✅"
                ) {

                    saveCarButton.textContent =
                        "حفظ السيارة";

                }

            }

        }
    );

}
