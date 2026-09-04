let auctionCars = [];


const auctionCarsContainer =
    document.getElementById(
        "auctionCarsContainer"
    );


const auctionCarsCount =
    document.getElementById(
        "auctionCarsCount"
    );


const auctionSearchInput =
    document.getElementById(
        "auctionSearchInput"
    );


const auctionHouseFilter =
    document.getElementById(
        "auctionHouseFilter"
    );


const auctionYearFilter =
    document.getElementById(
        "auctionYearFilter"
    );


const auctionSearchButton =
    document.getElementById(
        "auctionSearchButton"
    );


// =====================================
// تحميل سيارات المزاد
// =====================================

async function loadAuctionCars() {

    try {

        const response =
            await fetch(
                "/api/auction-cars"
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "فشل تحميل سيارات المزاد"
            );

        }


        auctionCars =
            data.cars || [];


        displayAuctionCars(
            auctionCars
        );


        updateAuctionCount(
            auctionCars.length
        );

    }

    catch (error) {

        console.error(error);


        if (auctionCarsContainer) {

            auctionCarsContainer.innerHTML = `
                <p class="auction-empty">
                    حدث خطأ أثناء تحميل سيارات المزاد.
                </p>
            `;

        }

    }

}


// =====================================
// عرض السيارات
// =====================================

function displayAuctionCars(cars) {

    if (!auctionCarsContainer) {
        return;
    }


    auctionCarsContainer.innerHTML =
        "";


    if (cars.length === 0) {

        auctionCarsContainer.innerHTML = `
            <div class="auction-empty">
                لا توجد سيارات مزاد مطابقة حاليًا.
            </div>
        `;

        return;

    }


    cars.forEach(
        function(car) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "auction-car-card";


            const image =
                car.main_image || "";


            const buyNow =
                car.buy_now_price
                    ? "$" +
                      Number(
                          car.buy_now_price
                      ).toLocaleString()
                    : "غير متوفر";


            const currentBid =
                car.current_bid
                    ? "$" +
                      Number(
                          car.current_bid
                      ).toLocaleString()
                    : "-";


            card.innerHTML = `

                <div class="auction-car-image">

                    ${
                        image
                        ? `
                            <img
                                src="${image}"
                                alt="${car.name || ""}"
                            >
                        `
                        : `
                            <div class="auction-no-image">
                                لا توجد صورة
                            </div>
                        `
                    }

                    <span class="auction-badge">
                        ${
                            car.auction_house ||
                            "مزاد"
                        }
                    </span>

                </div>


                <div class="auction-car-content">

                    <h3>
                        ${car.name || "سيارة مزاد"}
                    </h3>


                    <p class="auction-car-meta">

                        ${car.year || "-"}

                        •

                        ${car.brand || ""}

                        ${car.model || ""}

                    </p>


                    <div class="auction-car-data">

                        <div>

                            <span>
                                رقم اللوت
                            </span>

                            <strong>
                                ${car.lot_number || "-"}
                            </strong>

                        </div>


                        <div>

                            <span>
                                السعر الحالي
                            </span>

                            <strong>
                                ${currentBid}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Buy Now
                            </span>

                            <strong class="buy-now-price">
                                ${buyNow}
                            </strong>

                        </div>


                        <div>

                            <span>
                                العداد
                            </span>

                            <strong>
                                ${
                                    car.mileage
                                    ? Number(
                                        car.mileage
                                      ).toLocaleString() +
                                      " mi"
                                    : "-"
                                }
                            </strong>

                        </div>

                    </div>


                    <div class="auction-car-actions">

                        ${
                            car.source_url
                            ? `
                                <a
                                    href="${car.source_url}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="auction-source-button"
                                >
                                    فتح السيارة
                                </a>
                            `
                            : ""
                        }

                    </div>

                </div>

            `;


            auctionCarsContainer
                .appendChild(card);

        }
    );

}


// =====================================
// البحث
// =====================================

function filterAuctionCars() {

    const searchValue =
        (
            auctionSearchInput?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const houseValue =
        auctionHouseFilter?.value ||
        "";


    const yearValue =
        auctionYearFilter?.value ||
        "";


    const results =
        auctionCars.filter(
            function(car) {

                const searchableText =
                    `
                        ${car.name || ""}
                        ${car.brand || ""}
                        ${car.model || ""}
                        ${car.vin || ""}
                        ${car.lot_number || ""}
                    `
                    .toLowerCase();


                const searchMatch =
                    searchableText.includes(
                        searchValue
                    );


                const houseMatch =
                    houseValue === "" ||
                    car.auction_house ===
                        houseValue;


                const yearMatch =
                    yearValue === "" ||
                    String(car.year) ===
                        yearValue;


                return (
                    searchMatch &&
                    houseMatch &&
                    yearMatch
                );

            }
        );


    displayAuctionCars(
        results
    );


    updateAuctionCount(
        results.length
    );

}


// =====================================
// العدد
// =====================================

function updateAuctionCount(count) {

    if (auctionCarsCount) {

        auctionCarsCount.textContent =
            count;

    }

}


if (auctionSearchInput) {

    auctionSearchInput.addEventListener(
        "input",
        filterAuctionCars
    );

}


if (auctionSearchButton) {

    auctionSearchButton.addEventListener(
        "click",
        filterAuctionCars
    );

}


if (auctionHouseFilter) {

    auctionHouseFilter.addEventListener(
        "change",
        filterAuctionCars
    );

}


if (auctionYearFilter) {

    auctionYearFilter.addEventListener(
        "change",
        filterAuctionCars
    );

}


loadAuctionCars();
