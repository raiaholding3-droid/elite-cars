export async function onRequestPost(context) {

    try {

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
                { status: 400 }
            );

        }


        // =====================================
        // جلب المهمة
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


        // =====================================
        // إنشاء عبارة البحث
        // =====================================

        const searchText =
            [
                rule.brand,
                rule.model
            ]
            .filter(Boolean)
            .join(" ");


        /*
            نستخدم صفحة البحث كبداية.

            ملاحظة:
            Bid.Cars قد يغير طريقة تمرير الفلاتر،
            لذلك importer منفصل عن بقية الموقع.
        */

       const searchUrl =
    "https://bid.cars/en/";


        const searchResponse =
            await fetch(
                searchUrl,
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; EliteCarsImporter/1.0)",
                        "Accept":
                            "text/html"
                    }
                }
            );


        if (!searchResponse.ok) {

            throw new Error(
                "تعذر الوصول إلى صفحة بحث Bid.Cars"
            );

        }


        const html =
            await searchResponse.text();


        // =====================================
        // استخراج روابط السيارات
        // =====================================

        const lotRegex =
            /href=["'](\/en\/lot\/[^"'?#]+)["']/gi;


        const links =
            new Set();


        let match;


        while (
            (
                match =
                    lotRegex.exec(html)
            ) !== null
        ) {

            links.add(
                "https://bid.cars" +
                match[1]
            );

        }


        const lotLinks =
            Array.from(links);


        // =====================================
        // نتيجة الاختبار
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


        return Response.json({

            success: true,

            message:
                lotLinks.length > 0
                    ? "تم العثور على روابط سيارات."
                    : "تم الاتصال بـ Bid.Cars ولكن لم نجد روابط سيارات في HTML صفحة البحث.",

            rule: {
                id: rule.id,
                name: rule.name,
                brand: rule.brand,
                model: rule.model,
                search_text: searchText
            },

            found_links:
                lotLinks.length,

            sample_links:
                lotLinks.slice(0, 5)

        });

    }

    catch (error) {

        console.error(error);


        return Response.json(
            {
                success: false,

                message:
                    error.message ||
                    "حدث خطأ أثناء تشغيل مهمة المزاد"
            },
            {
                status: 500
            }
        );

    }

}
