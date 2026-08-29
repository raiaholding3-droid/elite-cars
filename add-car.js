const onlineAddCarForm =
    document.getElementById("onlineAddCarForm");

const addCarMessage =
    document.getElementById("addCarMessage");

const saveCarButton =
    document.getElementById("saveCarButton");


if (onlineAddCarForm) {

    onlineAddCarForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();

            saveCarButton.disabled = true;
            saveCarButton.textContent = "جاري الحفظ...";

            addCarMessage.textContent = "";


            const carData = {

                name:
                    document.getElementById("newCarName").value.trim(),

                brand:
                    document.getElementById("newCarBrand").value.trim(),

                model:
                    document.getElementById("newCarModel").value.trim(),

                year:
                    Number(
                        document.getElementById("newCarYear").value
                    ),

                vin:
                    document.getElementById("newCarVin").value
                        .trim()
                        .toUpperCase(),

                mileage:
                    document.getElementById("newCarMileage").value
                        ? Number(
                            document.getElementById("newCarMileage").value
                        )
                        : null,

                color:
                    document.getElementById("newCarColor").value.trim(),

                fuel_type:
                    document.getElementById("newCarFuel").value,

                body_type:
                    document.getElementById("newCarBodyType").value,

                engine:
                    document.getElementById("newCarEngine").value.trim(),

                transmission:
                    document.getElementById("newCarTransmission").value.trim(),

                price:
                    Number(
                        document.getElementById("newCarPrice").value
                    ),

                status:
                    document.getElementById("newCarStatus").value,

                description:
                    document.getElementById("newCarDescription").value.trim(),

                main_image: null
            };


            try {

                const response =
                    await fetch("/api/cars", {

                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(carData)

                    });


                const result =
                    await response.json();


                if (!response.ok || !result.success) {

                    throw new Error(
                        result.message ||
                        "لم تتم إضافة السيارة"
                    );

                }


                addCarMessage.textContent =
                    "تمت إضافة السيارة بنجاح ✅";

                onlineAddCarForm.reset();


                setTimeout(function() {

                    window.location.href =
                        "admin.html";

                }, 1500);

            }

            catch (error) {

                console.error(error);

                addCarMessage.textContent =
                    "حدث خطأ: " + error.message;

            }

            finally {

                saveCarButton.disabled = false;
                saveCarButton.textContent = "حفظ السيارة";

            }

        }
    );

}