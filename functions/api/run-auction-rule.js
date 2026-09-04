export async function onRequestPost(context) {

    try {

        const data =
            await context.request.json();


        const ruleId =
            Number(data.rule_id);


        if (!ruleId) {

            return Response.json(
                {
                    success: false,
                    message: "رقم المهمة غير موجود"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // جلب المهمة من D1
        // =====================================

        const rule =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_watch_rules
                    WHERE id = ?
                `)
                .bind(ruleId)
                .first();


        if (!rule) {

            return Response.json(
                {
                    success: false,
                    message: "المهمة غير موجودة"
                },
                {
                    status: 404
                }
            );

        }


        if (!rule.enabled) {

            return Response.json(
                {
                    success: false,
                    message: "المهمة متوقفة"
                },
                {
                    status: 400
                }
            );

        }


        // =====================================
        // تكوين بحث Bid.Cars
        // =====================================

        const searchTerms = [];

        if (rule.brand) {
            searchTerms.push(rule.brand);
        }

        if (rule.model) {
            searchTerms.push(rule.model);
        }


        const searchText =
            searchTerms.join(" ");


        const searchUrl =
            new URL(
                "https://bid.cars/en/search"
            );


        if (searchText) {

            searchUrl.searchParams.set(
                "search",
                searchText
            );

        }


        // =====================================
        // طلب صفحة البحث
        // =====================================

        const response =
            await fetch(
                searchUrl.toString(),
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                "فشل الوصول إلى Bid.Cars"
            );

        }


        const html =
            await response.text();


        // =====================================
        // في هذه النسخة لا نحفظ النتائج بعد
        // فقط نتأكد أن الاتصال يعمل
        // =====================================

        const hasFastBuy =
            html.includes("Fast Buy");


        const hasBrand =
            rule.brand
                ? html
                    .toLowerCase()
                    .includes(
                        rule.brand
                            .toLowerCase()
                    )
                : true;


        // تحديث آخر تشغيل

        await context.env.DB
            .prepare(`
                UPDATE auction_watch_rules

                SET
                    last_run_at =
                        CURRENT_TIMESTAMP,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(ruleId)
            .run();


        return Response.json({
            success: true,

            message:
                "تم الاتصال بـ Bid.Cars بنجاح",

            rule: {
                id: rule.id,
                name: rule.name,
                brand: rule.brand,
                model: rule.model
            },

            checks: {
                fast_buy_text_found:
                    hasFastBuy,

                brand_text_found:
                    hasBrand
            }

        });

    }

    catch (error) {

        console.error(error);


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء تشغيل المهمة"
            },
            {
                status: 500
            }
        );

    }

}
