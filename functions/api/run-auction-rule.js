export async function onRequestPost(context) {

    try {

        // =========================================
        // قراءة رقم المهمة
        // =========================================

        const body = await context.request.json();

        const ruleId = Number(body.rule_id);

        if (!ruleId) {

            return Response.json(
                {
                    success: false,
                    message: "رقم المهمة غير صحيح"
                },
                { status: 400 }
            );

        }


        // =========================================
        // جلب المهمة من D1
        // =========================================

        const rule = await context.env.DB
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
                { status: 404 }
            );

        }


        if (!rule.enabled) {

            return Response.json(
                {
                    success: false,
                    message: "المهمة متوقفة"
                },
                { status: 400 }
            );

        }


        // =========================================
        // بناء رابط Bid.Cars الحقيقي
        // =========================================

        const url = new URL(
            "https://bid.cars/app/search/request"
        );


        url.searchParams.set(
            "search-type",
            "filters"
        );


        url.searchParams.set(
            "status",
            rule.fast_buy_only
                ? "Fast-buy"
                : "All"
        );


        url.searchParams.set(
            "type",
            "Automobile"
        );


        url.searchParams.set(
            "make",
            rule.brand || "All"
        );


        url.searchParams.set(
            "model",
            rule.model || "All"
        );


        url.searchParams.set(
            "year-from",
            rule.year_from || "1900"
        );


        url.searchParams.set(
            "year-to",
            rule.year_to || "2027"
        );


        url.searchParams.set(
            "auction-type",
            rule.auction_house || "All"
        );


        // =========================================
        // الاتصال بـ Bid.Cars
        // =========================================

        const bidResponse = await fetch(
            url.toString(),
            {
                method: "GET",

                headers: {
                    "Accept": "application/json, text/plain, */*",
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );


        // =========================================
        // فحص حالة الاتصال
        // =========================================

        if (!bidResponse.ok) {

            return Response.json(
                {
                    success: false,

                    message:
    `Bid.Cars أعاد HTTP ${bidResponse.status} ${bidResponse.statusText}`,
                    bid_status:
                        bidResponse.status,

                    bid_status_text:
                        bidResponse.statusText,

                    request_url:
                        url.toString()
                },
                {
                    status: 502
                }
            );

        }


        // =========================================
        // قراءة JSON
        // =========================================

        const bidData =
            await bidResponse.json();


        const cars =
            Array.isArray(bidData.data)
                ? bidData.data
                : [];


        // =========================================
        // تحديث وقت آخر تشغيل فقط
        // لا نحفظ السيارات الآن
        // =========================================

        await context.env.DB
            .prepare(`
                UPDATE auction_watch_rules

                SET
                    last_run_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP

                WHERE id = ?
            `)
            .bind(ruleId)
            .run();


        // =========================================
        // إرسال نتيجة الاختبار
        // =========================================

        return Response.json({

            success: true,

            message:
                "تم الاتصال بـ Bid.Cars وقراءة JSON بنجاح",

            rule: {
                id: rule.id,
                name: rule.name,
                brand: rule.brand,
                model: rule.model,
                year_from: rule.year_from,
                year_to: rule.year_to
            },

            request_url:
                url.toString(),

            current_page:
                bidData.current_page ?? null,

            total:
                bidData.total ?? null,

            received_cars:
                cars.length,

            first_car:
                cars.length > 0
                    ? {
                        name:
                            cars[0].name_long ?? null,

                        vin:
                            cars[0].vin ?? null,

                        lot:
                            cars[0].lot ?? null,

                        buy_now_price:
                            cars[0].buy_now_price ?? null,

                        prebid_price:
                            cars[0].prebid_price ?? null
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
                    "حدث خطأ أثناء اختبار Bid.Cars"
            },
            {
                status: 500
            }
        );

    }

}
