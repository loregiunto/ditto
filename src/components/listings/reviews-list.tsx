import { MessageSquare, Star } from "lucide-react";
import type { ReviewsSummary } from "@/lib/listings/detail";
import styles from "./listing-detail.module.css";

type Props = {
  reviews: ReviewsSummary;
};

function formatRating(value: number): string {
  return value.toFixed(1).replace(".", ",");
}

export function ReviewsList({ reviews }: Props) {
  if (reviews.totalCount === 0) {
    return (
      <section className={styles.section} id="reviews">
        <h2 className={styles.sectionTitle}>
          <Star aria-hidden="true" />
          <em>Recensioni</em>
        </h2>
        <div className={styles.reviewsEmpty}>
          <div className={styles.emptyIcon}>
            <MessageSquare aria-hidden="true" />
          </div>
          <h3>
            Ancora nessuna <em>recensione</em>
          </h3>
          <p>
            Questo listing e appena entrato in HomeRest. Sarai tra i primi a
            provarlo e la tua opinione aiutera i prossimi ospiti.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="reviews">
      <h2 className={styles.sectionTitle}>
        <Star aria-hidden="true" />
        {reviews.averageRating ? formatRating(reviews.averageRating) : "-"} ·{" "}
        {reviews.totalCount} <em>recensioni</em>
      </h2>
      <div className={styles.reviewList}>
        {reviews.items.slice(0, 5).map((review) => (
          <article className={styles.review} key={review.id}>
            <div className={styles.reviewHead}>
              <div className={styles.avatar}>
                {review.authorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.authorImage} alt="" />
                ) : (
                  review.authorName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className={styles.reviewName}>{review.authorName}</div>
                <div className={styles.reviewWhen}>{review.createdAt}</div>
              </div>
            </div>
            <div className={styles.reviewRating} aria-label={`${review.rating}/5`}>
              {Array.from({ length: 5 }, (_, index) => (
                <Star
                  aria-hidden="true"
                  key={index}
                  className={index >= review.rating ? styles.emptyStar : ""}
                />
              ))}
            </div>
            <p>{review.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
