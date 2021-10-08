import Head  from 'next/head';
import Link from 'next/link';
import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client'

import { FiCalendar, FiUser } from "react-icons/fi";

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: Boolean;
}

export default function Home({postsPagination: {next_page, results}, preview}:HomeProps) {

  const [posts, setPosts] = useState(results);
  const [nextPage, setNextPage] = useState(next_page);


  async function handleGetMorePosts(): Promise<void> {
    const response = await (await fetch(nextPage)).json();

    setPosts([...posts, ...response.results]);
    setNextPage(response.next_page);
  }

   return (
     <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <Header/>
        
        {posts.map(post => (
          <div key={post.uid} className={styles.post}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h3 className={styles.title}>{post.data.title}</h3>
                <p className={styles.subtitle}>{post.data.subtitle}</p>
                <div className={styles.icons_group}>
                  <time>
                    <FiCalendar className={commonStyles.icon}/>
                    {format (
                      parseISO(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </time>
                  <span>
                    <FiUser className={commonStyles.icon}/>
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          </div>
        ))}

        {nextPage && (
          <button type="button" onClick={handleGetMorePosts}>
            Carregar mais posts
          </button>
        )}

        {preview && (
          <aside>
            <Link href="api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
		     )}

      </main>
     </>
   )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
   const prismic = getPrismicClient();
   const postsResponse = await prismic.query([
      Prismic.predicates.at('document.type', 'posts')
    ],
    {
      fetch: [
        'posts.title', 
        'posts.subtitle', 
        'posts.author'],
        pageSize: 1,
        ref: previewData?.ref ?? null,
    }
   );

   const posts = postsResponse.results.map(post => {
     return {
       uid: post.uid,
       first_publication_date: post.first_publication_date,
       data : {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
       }
     }
   });

   return {
     props : {
       postsPagination: {
         results: posts,
         next_page: postsResponse.next_page,
       },
       preview
     }
   }
};
