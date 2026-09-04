export async function onRequestPost(context) {

    try {

        // =====================================
        // قراءة رقم المهمة
        // =====================================

        const body =
            await context.request.json();

        const ruleId =
            Number(body.rule_id);


        if (!ruleId) {

            return Response.json(
                {
                    success: false,
                    message: "رقم المهمة غير صحيح"
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
        // التأكد من وجود مفتاح Apibara
        // =====================================

        const apiKey =
            context.env.APIBARA_API_KEY;


        if (!apiKey) {

            return Response.json(
                {
                    success: false,
                    message:
                        "APIBARA_API_KEY غير موجود في Cloudflare"
                },
                {
                    status: 500
                }
            );

        }


        // =====================================
        // إنشاء رابط Apibara
        // =====================================

        const url =
            new URL(
                "https://apibara.tech/api/v1/vehicle-auction/vehicles"
            );


        if (rule.brand) {

            url.searchParams.set(
                "make",
                rule.brand
            );

        }


        if (rule.model) {

            url.searchParams.set(
                "model",
                rule.model
            );

        }


        if (rule.year_from) {

            url.searchParams.set(
                "year_from",
                rule.year_from
            );

        }


        if (rule.year_to) {

            url.searchParams.set(
                "year_to",
                rule.year_to
            );

        }


        // =====================================
        // Buy Now فقط
        // =====================================

        if (rule.fast_buy_only) {

            url.searchParams.set(
                "lot_status",
                "Buy Now"
            );

        }

        else {

            url.searchParams.set(
                "lot_status",
                "All"
            );

        }


        // =====================================
        // شركة المزاد
        // =====================================

        if (
            rule.auction_house === "Copart"
        ) {

            url.searchParams.set(
                "platform",
                "copart"
            );

        }


        if (
            rule.auction_house === "IAA" ||
            rule.auction_house === "IAAI"
        ) {

            url.searchParams.set(
                "platform",
                "iaai"
            );

        }


        // عدد قليل للاختبار
        url.searchParams.set(
            "per_page",
            "10"
        );


        // =====================================
        // الاتصال بـ Apibara
        // =====================================

        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",

                    headers: {

                        "Accept":
                            "application/json",

                        "X-API-Key":
                            apiKey

                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            return Response.json(
                {
                    success: false,

                    message:
                        data.message ||
                        `Apibara HTTP ${response.status}`,

                    status:
                        response.status
                },
                {
                    status: 502
                }
            );

        }


        if (!data.ok) {

            return Response.json(
                {
                    success: false,

                    message:
                        data.message ||
                        "Apibara أعاد نتيجة غير ناجحة"
                },
                {
                    status: 502
                }
            );

        }


        const cars =
            Array.isArray(data.data)
                ? data.data
                : [];


        // =====================================
        // تحديث آخر تشغيل
        // =====================================

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


        // =====================================
        // اختبار فقط - بدون حفظ السيارات
        // =====================================

        return Response.json({

            success: true,

            message:
                "تم الاتصال بـ Apibara بنجاح",

            received_cars:
                cars.length,

            request_url:
                url.toString(),

            first_car:
                cars.length > 0
                    ? {
                        platform:
                            cars[0].platform || null,

                        lot_number:
                            cars[0].lot_number || null,

                        vin:
                            cars[0].vin || null,

                        title:
                            cars[0].title || null,

                        year:
                            cars[0].year || null,

                        make:
                            cars[0].make || null,

                        model:
                            cars[0].model || null,

                        current_bid:
                            cars[0].pricing
                                ?.current_bid_usd ?? null,

                        buy_now:
                            cars[0].pricing
                                ?.buy_now_usd ?? null,

                        damage:
                            cars[0].condition
                                ?.primary_damage ?? null,

                        odometer:
                            cars[0].odometer
                                ?.mi ?? null
                    }
                    : null

        });

    }

    catch (error) {

        console.error(error);


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء الاتصال بـ Apibara"
            },
            {
                status: 500
            }
        );

    }

}
