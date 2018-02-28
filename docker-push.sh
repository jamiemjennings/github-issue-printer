#!/bin/bash
set -ev
docker login -u $DOCKER_USER --password-stdin <<< $DOCKER_PASS
if [ "$TRAVIS_BRANCH" == "master" ] ; then 
	docker push jamiemjennings/github-issue-printer
else
	docker push jamiemjennings/github-issue-printer:${BUILD_VERSION}
fi
