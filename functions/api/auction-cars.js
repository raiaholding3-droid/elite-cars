export async function onRequestGet(context) {

    try {

        const { results } =
            await context.env.DB
                .prepare(`
                    SELECT *
                    FROM auction_cars
                    WHERE status = 'active'
                    ORDER BY last_seen_at DESC, id DESC
                `)
                .all();


        return Response.json({
            success: true,
            cars: results
        });

    }

    catch (error) {

        console.error(error);


        return Response.json(
            {
                success: false,
                message:
                    error.message ||
                    "حدث خطأ أثناء جلب سيارات المزاد"
            },
            {
                status: 500
            }
        );

    }

}
