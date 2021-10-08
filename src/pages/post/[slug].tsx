import {  format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { GetStaticPaths, GetStaticProps } from 'next';
import Head  from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client'
import { RichText } from 'prismic-dom';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';


import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  nextPost: Post | null ;
  prevPost: Post | null;
}

export default function Post({
                  post, 
                  preview,
                  prevPost,
                  nextPost,}: PostProps) {
  const router = useRouter();
  if(router.isFallback) {
    return <div>Carregando...</div>
  }



  const readingTime = post.data.content.reduce((acc, content) => {
    const TextBody = RichText.asText(content.body);
    const split = TextBody.split(' ');
    const numberWords = split.length;
    const result = Math.ceil(numberWords / 200);
    return acc + result;
  }, 0);



  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <div className={commonStyles.container}>
        <Header/>
      </div>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>
        <div className={commonStyles.container}>
          <main className={styles.container_post}>
            <article className={styles.content}>
              <h1>{post.data.title}</h1>

              <div className={styles.content_body}>
                <footer>
                  <time>
                    <FiCalendar color="#bbbbbb" size={20} className={commonStyles.icon}/>
                    {format (
                          parseISO(post.first_publication_date),
                          'dd MMM yyyy',
                          {
                            locale: ptBR,
                          }
                        )}
                  </time>

                  
                  <span> 
                    <FiUser color="#bbbbbb" size={20} className={commonStyles.icon}/> 
                    {post.data.author}
                  </span>
                  
                  <span>
                    *editado em{' '}
                    {format(
                      parseISO(post.last_publication_date),
                      "d MMM yyyy', às 'HH:mm",
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>

                  <span>
                    <FiClock color="#BBBBBB" size={20} className={commonStyles.icon}/>
                    {readingTime} min
                  </span>
                </footer>

                <main className={styles.content_text}>
                  {post.data.content.map(item => (
                    <section>
                      <h2>{item.heading}</h2>

                      <article dangerouslySetInnerHTML={{
                          __html: RichText.asHtml(item.body),
                        }} />
                    </section>
                  ))}
                </main>
              </div>
            </article>

            <div className={styles.navigatePost}>
              {prevPost && (
                <Link href={`/post/${prevPost.uid}`}>
                  <a className={styles.prevPost}>
                    {prevPost.data.title}
                    <span>Post anterior</span>
                  </a>
                </Link>
              )}
              {nextPost && (
                <Link href={`/post/${nextPost.uid}`}>
                  <a className={styles.nextPost}>
                    {nextPost.data.title}
                    <span>Post anterior</span>
                  </a>
                </Link>
              )}
            </div>

            <div className={commonStyles.comment} id="comments">
              <Comments />
            </div>

            {preview && (
              <aside className={commonStyles.previewExit}>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
          </main>
        </div>
    </>
  )
} 

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid
    },
  }));

  return {
    paths,
    fallback: true,
  }

};

export const getStaticProps: GetStaticProps = async ({
  params: {slug},
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null
  });

  if(!response){
    return {
      notFound: true,
    }
  }

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.uid,
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title']
    })
  ).results[0];

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'posts'), {
      pageSize: 1,
      after: response.uid,
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    })
  ).results[0];



  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
      preview,
      prevPost: prevPost ?? null,
      nextPost: nextPost ?? null,
    },
    revalidate: 60 * 60 * 24, //24hs
  };


};
