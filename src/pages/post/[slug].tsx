import {  format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client'
import { GetStaticPaths, GetStaticProps } from 'next';
import Head  from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({post}: PostProps) {
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
      <Header/>
      <div>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>
      <main>
        <article>
          <h1>{post.data.title}</h1>

          <div>
            <footer>
              <time>
                <FiCalendar color="#bbbbbb" size={20} />
                {format (
                      parseISO(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
              </time>

              <FiUser color="#bbbbbb" size={20}/>
              <span>{post.data.author}</span>
              <FiClock color="#BBBBBB" size={20} />
              <span>{readingTime} min</span>
            </footer>

            <main>
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
      </main>
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

  const post = {
    first_publication_date: response.first_publication_date,
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
    },
    revalidate: 60 * 60 * 24, //24hs
  };


};
