const openRuleFormButton =
    document.getElementById(
        "openRuleFormButton"
    );

const auctionRuleFormSection =
    document.getElementById(
        "auctionRuleFormSection"
    );

const auctionRuleForm =
    document.getElementById(
        "auctionRuleForm"
    );

const cancelRuleButton =
    document.getElementById(
        "cancelRuleButton"
    );

const auctionRulesContainer =
    document.getElementById(
        "auctionRulesContainer"
    );


if (openRuleFormButton) {

    openRuleFormButton.addEventListener(
        "click",
        function() {

            auctionRuleFormSection.style.display =
                "block";

        }
    );

}


if (cancelRuleButton) {

    cancelRuleButton.addEventListener(
        "click",
        function() {

            auctionRuleFormSection.style.display =
                "none";

            auctionRuleForm.reset();

        }
    );

}


// =====================================
// تحميل المهام
// =====================================

async function loadAuctionRules() {

    console.log("بدء تحميل المهام...");

    try {

        const response =
            await fetch(
                "/api/auction-rules?t=" + Date.now(),
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    },
                    cache: "no-store"
                }
            );


        console.log(
            "HTTP:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "بيانات المهام:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "فشل تحميل المهام"
            );

        }


        if (!auctionRulesContainer) {

            console.error(
                "auctionRulesContainer غير موجود"
            );

            return;

        }


        displayAuctionRules(
            data.rules || []
        );

    }

    catch (error) {

        console.error(
            "خطأ تحميل المهام:",
            error
        );


        if (auctionRulesContainer) {

            auctionRulesContainer.innerHTML = `
                <div style="
                    background:#fff0f0;
                    padding:20px;
                    border-radius:12px;
                    color:#a52020;
                ">
                    حدث خطأ أثناء تحميل المهام:
                    ${error.message}
                </div>
            `;

        }

    }

}

// =====================================
// عرض المهام
// =====================================

function displayAuctionRules(rules) {

    auctionRulesContainer.innerHTML =
        "";


    if (rules.length === 0) {

        auctionRulesContainer.innerHTML =
            "<p>لا توجد مهام حتى الآن.</p>";

        return;

    }


    rules.forEach(
        function(rule) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "auction-rule-card";


            card.innerHTML = `

                <div class="auction-rule-main">

                    <h3>
                        ${rule.name}
                    </h3>

                    <p>
                        ${rule.brand}
                        ${rule.model || ""}
                    </p>

                    <p>
                        السنوات:
                        ${rule.year_from || "-"}
                        إلى
                        ${rule.year_to || "-"}
                    </p>

                    <p>
                        السعر الأقصى:
                        ${
                            rule.price_max
                            ? "$" +
                              Number(
                                  rule.price_max
                              ).toLocaleString()
                            : "بدون حد"
                        }
                    </p>

                    <p>
                        نوع البيع:
                        ${
                            rule.fast_buy_only
                            ? "Fast Buy"
                            : "الكل"
                        }
                    </p>

                    <p>
                        الحالة:
                        ${
                            rule.enabled
                            ? "🟢 مفعلة"
                            : "🔴 متوقفة"
                        }
                    </p>

                </div>


                <div class="auction-rule-actions">

                    <button
                        onclick="runRuleNow(${rule.id})"
                    >
                        تشغيل الآن
                    </button>

                    <button
                        onclick="deleteAuctionRule(${rule.id})"
                    >
                        حذف
                    </button>

                </div>

            `;


            auctionRulesContainer
                .appendChild(card);

        }
    );

}


// =====================================
// حفظ مهمة جديدة
// =====================================

if (auctionRuleForm) {

    auctionRuleForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const ruleData = {

                name:
                    document
                        .getElementById(
                            "ruleName"
                        )
                        .value
                        .trim(),

                brand:
                    document
                        .getElementById(
                            "ruleBrand"
                        )
                        .value
                        .trim(),

                model:
                    document
                        .getElementById(
                            "ruleModel"
                        )
                        .value
                        .trim(),

                year_from:
                    Number(
                        document
                            .getElementById(
                                "ruleYearFrom"
                            )
                            .value
                    ) || null,

                year_to:
                    Number(
                        document
                            .getElementById(
                                "ruleYearTo"
                            )
                            .value
                    ) || null,

                price_min:
                    Number(
                        document
                            .getElementById(
                                "rulePriceMin"
                            )
                            .value
                    ) || null,

                price_max:
                    Number(
                        document
                            .getElementById(
                                "rulePriceMax"
                            )
                            .value
                    ) || null,

                auction_house:
                    document
                        .getElementById(
                            "ruleAuctionHouse"
                        )
                        .value,

                fast_buy_only:
                    document
                        .getElementById(
                            "ruleFastBuy"
                        )
                        .value === "1",

                enabled:
                    document
                        .getElementById(
                            "ruleEnabled"
                        )
                        .value === "1"

            };


            try {

                const response =
                    await fetch(
                        "/api/auction-rules",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    ruleData
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
                        "فشل حفظ المهمة"
                    );

                }


                auctionRuleForm.reset();

                auctionRuleFormSection.style.display =
                    "none";


                await loadAuctionRules();

            }

            catch (error) {

                alert(
                    "حدث خطأ:\n" +
                    error.message
                );

            }

        }
    );

}


// =====================================
// حذف مهمة
// =====================================

async function deleteAuctionRule(id) {

    const confirmed =
        confirm(
            "هل تريد حذف هذه المهمة؟"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/auction-rules?id=${id}`,
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
                "فشل الحذف"
            );

        }


        await loadAuctionRules();

    }

    catch (error) {

        alert(
            "حدث خطأ:\n" +
            error.message
        );

    }

}
// =====================================
// تشغيل مهمة الآن
// =====================================

async function runRuleNow(id) {

    try {

        console.log(
            "جاري الاتصال بـ Apibara..."
        );


        const response =
            await fetch(
                "/api/run-auction-rule",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            rule_id: id
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
                "فشل تشغيل المهمة"
            );

        }


        let message =
    "تم تشغيل المهمة ✅\n\n";

message +=
    result.message + "\n\n";

message +=
    "السيارات المستلمة: " +
    (result.received_cars ?? 0) +
    "\n";

message +=
    "سيارات جديدة: " +
    (result.inserted ?? 0) +
    "\n";

message +=
    "سيارات تم تحديثها: " +
    (result.updated ?? 0) +
    "\n";

message +=
    "تم ربطها بالمهمة: " +
    (result.matched ?? 0);


alert(message);


        await loadAuctionRules();

    }

    catch (error) {

        console.error(
            "خطأ تشغيل المهمة:",
            error
        );


        alert(
            "حدث خطأ:\n" +
            error.message
        );

    }

}


// =====================================
// تحميل المهام عند فتح الصفحة
// =====================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        function() {

            console.log(
                "صفحة مهام المزاد جاهزة"
            );

            loadAuctionRules();

        }
    );

} else {

    loadAuctionRules();

}
